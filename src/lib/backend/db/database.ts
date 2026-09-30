import { ORFARCHIV_DB_URL, ORFARCHIV_DB_URLS } from '$app/env/private';
import { parseTargets, redact, type Target } from '$common/targets';
import {
  DB_CLIENT_OPTIONS,
  DB_NAME,
  DB_NEWS_COLLECTION,
  DB_QUERY_TIMEOUT,
  DB_TARGET_COOLDOWN,
  logger,
} from '$lib/configs/server';
import { DatabaseConfigError, SearchError } from '$lib/errors/errors';
import { Clock, Context, Duration, Effect, Layer, Ref } from 'effect';
import { type Collection, MongoClient } from 'mongodb';

interface TargetState {
  readonly target: Target;
  readonly client: MongoClient | undefined;
  readonly established: boolean;
  readonly downUntil: number;
}

type TargetStates = Ref.Ref<ReadonlyArray<TargetState>>;

export interface TargetHealth {
  readonly label: string;
  readonly up: boolean;
  readonly connected: boolean;
  readonly downUntil?: Date;
}

export type DatabaseServiceShape = Context.Service.Shape<typeof DatabaseService>;
export class DatabaseService extends Context.Service<DatabaseService>()('db/DatabaseService', {
  make: Effect.gen(function* () {
    const targets = yield* resolveTargets();
    const state = yield* Ref.make<ReadonlyArray<TargetState>>(
      targets.map((target) => ({ target, client: undefined, established: false, downUntil: 0 })),
    );
    yield* Effect.addFinalizer(() => closeAll(state));

    logger.info(`Using database targets: ${targets.map((target) => target.label).join(', ')}`);
    return defineService({ state });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function resolveTargets(): Effect.Effect<ReadonlyArray<Target>, DatabaseConfigError> {
  const targets = parseTargets(ORFARCHIV_DB_URLS ?? '');
  const resolved = targets.length > 0 ? targets : parseTargets(ORFARCHIV_DB_URL ?? '');
  if (resolved.length === 0) {
    return Effect.fail(
      new DatabaseConfigError({ message: 'Neither ORFARCHIV_DB_URLS nor ORFARCHIV_DB_URL is configured.' }),
    );
  }
  return Effect.succeed(resolved);
}

function defineService({ state }: { state: TargetStates }) {
  function useNewsCollection<TResult>(
    errorMessage: string,
    use: (newsCollection: Collection<Document>) => Promise<TResult>,
  ): Effect.Effect<TResult, SearchError> {
    return Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;
      const currentState = yield* Ref.get(state);
      const available = currentState.filter((targetState) => targetState.downUntil <= now);
      const candidates = (available.length > 0 ? available : currentState).map((targetState) => targetState.target);

      return yield* Effect.firstSuccessOf(candidates.map((target) => attempt(target, use))).pipe(
        Effect.mapError(
          (cause) =>
            new SearchError({ message: errorMessage, cause, targets: candidates.map((target) => target.label) }),
        ),
      );
    });
  }

  function attempt<TResult>(
    target: Target,
    use: (newsCollection: Collection<Document>) => Promise<TResult>,
  ): Effect.Effect<TResult, unknown> {
    return Effect.gen(function* () {
      const client = yield* clientFor(target);
      return yield* Effect.tryPromise({
        try: () => use(client.db(DB_NAME).collection(DB_NEWS_COLLECTION)),
        catch: (cause) => cause,
      }).pipe(
        Effect.timeout(DB_QUERY_TIMEOUT),
        Effect.tapError(() => discardUnestablished(target, client)),
      );
    }).pipe(
      Effect.tapError((cause) => markDown(target, cause)),
      Effect.tap(() => markUp(target)),
    );
  }

  function clientFor(target: Target): Effect.Effect<MongoClient, unknown> {
    return Effect.gen(function* () {
      const currentState = yield* Ref.get(state);
      const existing = findState(currentState, target).client;
      if (existing) {
        return existing;
      }

      const created = yield* Effect.try({
        try: () => new MongoClient(target.url, DB_CLIENT_OPTIONS),
        catch: (cause) => cause,
      });
      const client = yield* Ref.modify(state, (states) => {
        const current = findState(states, target).client;
        return current
          ? [current, states]
          : [created, updateState(states, target, { client: created, established: false })];
      });
      if (client !== created) {
        yield* closeClient(created);
      }
      return client;
    });
  }

  function markDown(target: Target, cause: unknown): Effect.Effect<void> {
    return Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;
      const downUntil = now + Duration.toMillis(DB_TARGET_COOLDOWN);
      yield* Ref.update(state, (states) => updateState(states, target, { downUntil }));
      logger.warn(`Database target '${target.label}' failed: ${redact(describeCause(cause))}`);
    });
  }

  function markUp(target: Target): Effect.Effect<void> {
    return Ref.update(state, (states) => {
      const { established, downUntil } = findState(states, target);
      return established && downUntil === 0 ? states : updateState(states, target, { established: true, downUntil: 0 });
    });
  }

  function discardUnestablished(target: Target, client: MongoClient): Effect.Effect<void> {
    return Effect.gen(function* () {
      const discarded = yield* Ref.modify(state, (states) => {
        const current = findState(states, target);
        return current.client === client && !current.established
          ? [true, updateState(states, target, { client: undefined })]
          : [false, states];
      });
      if (discarded) {
        yield* closeClient(client);
      }
    });
  }

  const health: Effect.Effect<ReadonlyArray<TargetHealth>> = Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis;
    const currentState = yield* Ref.get(state);
    return currentState.map(({ target, established, downUntil }) => ({
      label: target.label,
      up: downUntil <= now,
      connected: established,
      ...(downUntil > now ? { downUntil: new Date(downUntil) } : {}),
    }));
  });

  return { useNewsCollection, health } as const;
}

function closeAll(state: TargetStates): Effect.Effect<void> {
  return Effect.gen(function* () {
    const currentState = yield* Ref.get(state);
    const clients = currentState.flatMap(({ client }) => (client ? [client] : []));
    yield* Effect.forEach(clients, closeClient, { concurrency: 'unbounded', discard: true });
  });
}

function closeClient(client: MongoClient): Effect.Effect<void> {
  return Effect.tryPromise(() => client.close()).pipe(Effect.ignore);
}

function findState(states: ReadonlyArray<TargetState>, target: Target): TargetState {
  return states.find((targetState) => targetState.target === target)!;
}

function updateState(
  states: ReadonlyArray<TargetState>,
  target: Target,
  patch: Partial<Omit<TargetState, 'target'>>,
): ReadonlyArray<TargetState> {
  return states.map((targetState) => (targetState.target === target ? { ...targetState, ...patch } : targetState));
}

function describeCause(cause: unknown): string {
  return cause instanceof Error ? cause.message || cause.name : String(cause);
}
