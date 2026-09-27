import { logger } from '$lib/configs/server';
import { DatabaseConfigError, SearchError } from '$lib/errors/errors';
import { it } from '@effect/vitest';
import { Effect, Exit, Fiber, Scope } from 'effect';
import { TestClock } from 'effect/testing';
import { beforeEach, describe, expect, vi } from 'vitest';
import { DatabaseService, type DatabaseServiceShape } from './database';

interface FakeServer {
  mode: 'ok' | 'fail' | 'hang';
  queries: number;
  closed: number;
}

interface FakeCollection {
  findOne: () => Promise<string>;
}

const { env, servers, createdClients } = vi.hoisted(() => ({
  env: { urls: undefined as string | undefined, url: undefined as string | undefined },
  servers: new Map<string, FakeServer>(),
  createdClients: [] as Array<string>,
}));

vi.mock('$app/env/private', () => ({
  get ORFARCHIV_DB_URLS() {
    return env.urls;
  },
  get ORFARCHIV_DB_URL() {
    return env.url;
  },
}));

vi.mock('$lib/configs/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/configs/server')>()),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('mongodb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongodb')>();

  class MongoClient {
    private established = false;
    private topologyClosed = false;

    constructor(private readonly url: string) {
      if (!url.startsWith('mongodb://')) {
        throw new Error(`Invalid scheme, expected connection string to start with "mongodb://": ${url}`);
      }
      createdClients.push(url);
    }

    db() {
      return {
        collection: (): FakeCollection => ({
          findOne: async () => {
            if (this.topologyClosed) {
              throw new Error('Topology is closed');
            }
            const server = servers.get(this.url);
            if (!server || server.mode === 'fail') {
              this.topologyClosed = !this.established;
              throw new Error(`connect ECONNREFUSED ${this.url}`);
            }
            server.queries++;
            if (server.mode === 'hang') {
              return new Promise<string>(() => {});
            }
            this.established = true;
            return this.url;
          },
        }),
      };
    }

    async close() {
      servers.get(this.url)!.closed++;
    }
  }

  return { ...actual, MongoClient };
});

const primary = 'mongodb://user:secret@primary:27017/';
const secondary = 'mongodb://user:secret@secondary:27017/';

function addServer(url: string, mode: FakeServer['mode'] = 'ok'): FakeServer {
  const server: FakeServer = { mode, queries: 0, closed: 0 };
  servers.set(url, server);
  return server;
}

function query(database: DatabaseServiceShape) {
  return database.useNewsCollection('Failed to query.', (collection) =>
    (collection as unknown as FakeCollection).findOne(),
  );
}

describe('DatabaseService', () => {
  beforeEach(() => {
    env.urls = undefined;
    env.url = undefined;
    servers.clear();
    createdClients.length = 0;
    vi.mocked(logger.warn).mockClear();
  });

  describe('configuration', () => {
    it.effect('falls back to ORFARCHIV_DB_URL when ORFARCHIV_DB_URLS is unset', () =>
      Effect.gen(function* () {
        env.url = primary;
        addServer(primary);

        const database = yield* DatabaseService.make;

        expect(yield* query(database)).toBe(primary);
        expect((yield* database.health).map((health) => health.label)).toEqual(['primary:27017']);
      }),
    );

    it.effect('prefers ORFARCHIV_DB_URLS over ORFARCHIV_DB_URL', () =>
      Effect.gen(function* () {
        env.url = 'mongodb://ignored:27017/';
        env.urls = `${primary}\n${secondary}`;

        const database = yield* DatabaseService.make;

        expect((yield* database.health).map((health) => health.label)).toEqual(['primary:27017', 'secondary:27017']);
      }),
    );

    it.effect('fails only when no target is configured', () =>
      Effect.gen(function* () {
        const error = yield* Effect.flip(DatabaseService.make);
        expect(error).toBeInstanceOf(DatabaseConfigError);
      }),
    );

    it.effect('builds without touching any target, even when none is reachable', () =>
      Effect.gen(function* () {
        env.urls = `${primary};${secondary}`;

        const database = yield* DatabaseService.make;

        expect(createdClients).toEqual([]);
        expect((yield* database.health).every((health) => health.up && !health.connected)).toBe(true);
      }),
    );
  });

  describe('failover', () => {
    it.effect('serves from the primary while it is healthy', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}`;
        addServer(primary);
        const backup = addServer(secondary);

        const database = yield* DatabaseService.make;

        expect(yield* query(database)).toBe(primary);
        expect(yield* query(database)).toBe(primary);
        expect(backup.queries).toBe(0);
      }),
    );

    it.effect('serves from the secondary when the primary fails', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}`;
        addServer(primary, 'fail');
        addServer(secondary);

        const database = yield* DatabaseService.make;

        expect(yield* query(database)).toBe(secondary);
        expect((yield* database.health).map((health) => health.up)).toEqual([false, true]);
      }),
    );

    it.effect('fails with every attempted label when all targets fail', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}`;
        addServer(primary, 'fail');
        addServer(secondary, 'fail');

        const database = yield* DatabaseService.make;
        const error = yield* Effect.flip(query(database));

        expect(error).toBeInstanceOf(SearchError);
        expect(error.message).toBe('Failed to query.');
        expect(error.targets).toEqual(['primary:27017', 'secondary:27017']);
        expect(String((error.cause as Error).message)).toContain('secondary');
      }),
    );

    it.effect('treats a malformed url as a failed target', () =>
      Effect.gen(function* () {
        env.urls = `invalid://primary\n${secondary}`;
        addServer(secondary);

        const database = yield* DatabaseService.make;

        expect(yield* query(database)).toBe(secondary);
      }),
    );

    it.effect('times out a hanging target and falls over to the next one', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}`;
        addServer(primary, 'hang');
        addServer(secondary);

        const database = yield* DatabaseService.make;
        const fiber = yield* Effect.forkChild(query(database));
        yield* TestClock.adjust('5 seconds');

        expect(yield* Fiber.join(fiber)).toBe(secondary);
      }),
    );
  });

  describe('circuit breaker', () => {
    it.effect('skips a down target during the cooldown and re-probes it afterwards', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}`;
        const main = addServer(primary, 'fail');
        addServer(secondary);

        const database = yield* DatabaseService.make;
        yield* query(database);

        main.mode = 'ok';
        yield* TestClock.adjust('29 seconds');
        expect(yield* query(database)).toBe(secondary);
        expect(main.queries).toBe(0);

        yield* TestClock.adjust('1 second');
        expect(yield* query(database)).toBe(primary);
        expect((yield* database.health).every((health) => health.up)).toBe(true);
      }),
    );

    it.effect('still tries every target when all of them are in cooldown', () =>
      Effect.gen(function* () {
        env.url = primary;
        const main = addServer(primary, 'fail');

        const database = yield* DatabaseService.make;
        yield* Effect.flip(query(database));

        main.mode = 'ok';
        expect(yield* query(database)).toBe(primary);
      }),
    );

    it.effect('keeps the client of a target that has connected before', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}`;
        const main = addServer(primary);
        addServer(secondary);

        const database = yield* DatabaseService.make;
        yield* query(database);
        main.mode = 'fail';
        expect(yield* query(database)).toBe(secondary);
        main.mode = 'ok';
        yield* TestClock.adjust('30 seconds');

        expect(yield* query(database)).toBe(primary);
        expect(createdClients.filter((url) => url === primary)).toHaveLength(1);
        expect(main.closed).toBe(0);
      }),
    );

    it.effect('replaces the client of a target that was unreachable on first use', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}`;
        const main = addServer(primary, 'fail');
        addServer(secondary);

        const database = yield* DatabaseService.make;
        expect(yield* query(database)).toBe(secondary);
        expect(main.closed).toBe(1);

        main.mode = 'ok';
        yield* TestClock.adjust('30 seconds');

        expect(yield* query(database)).toBe(primary);
        expect(createdClients.filter((url) => url === primary)).toHaveLength(2);
      }),
    );
  });

  describe('lifecycle', () => {
    it.effect('creates one client per target across concurrent queries', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}`;
        addServer(primary);
        addServer(secondary);

        const database = yield* DatabaseService.make;
        yield* Effect.all(
          Array.from({ length: 10 }, () => query(database)),
          { concurrency: 'unbounded' },
        );

        expect(createdClients).toEqual([primary]);
      }),
    );

    it.effect('closes every opened client when the scope closes', () =>
      Effect.gen(function* () {
        env.urls = `${primary}\n${secondary}\nmongodb://unused:27017/`;
        const main = addServer(primary);
        const backup = addServer(secondary);
        const unused = addServer('mongodb://unused:27017/');

        const scope = yield* Scope.make();
        const database = yield* DatabaseService.make.pipe(Scope.provide(scope));
        yield* query(database);
        main.mode = 'fail';
        yield* query(database);
        expect([main.closed, backup.closed]).toEqual([0, 0]);
        yield* Scope.close(scope, Exit.void);

        expect([main.closed, backup.closed, unused.closed]).toEqual([1, 1, 0]);
      }),
    );
  });

  it.effect('never logs credentials', () =>
    Effect.gen(function* () {
      env.urls = `${primary}\n${secondary}`;
      addServer(primary, 'fail');
      addServer(secondary, 'fail');

      const database = yield* DatabaseService.make;
      yield* Effect.flip(query(database));

      const logged = [...vi.mocked(logger.info).mock.calls, ...vi.mocked(logger.warn).mock.calls].flat().join('\n');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(2);
      expect(logged).toContain('primary:27017');
      expect(logged).not.toContain('secret');
    }),
  );
});
