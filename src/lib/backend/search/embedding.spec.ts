import { quantize } from '#common/embedding/embedding.ts';
import { EmbeddingError } from '#lib/errors/errors.ts';
import { it } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { HttpClient, HttpClientResponse } from 'effect/http';
import { RateLimiter } from 'effect/persistence';
import { describe, expect, vi } from 'vitest';
import { EmbeddingService, normalizeQuery } from './embedding';

vi.mock('$app/env/private', () => ({
  ORFARCHIV_EMBEDDING_URL: 'http://embeddings.test/v1',
  ORFARCHIV_EMBEDDING_TOKEN: undefined,
  ORFARCHIV_EMBEDDING_RATE_LIMIT: undefined,
  ORFARCHIV_EMBEDDING_RATE_WINDOW: undefined,
}));

describe('normalizeQuery', () => {
  it('capitalizes a single all-lowercase word', () => {
    expect(normalizeQuery('russland')).toBe('Russland');
    expect(normalizeQuery('wald')).toBe('Wald');
  });

  it('capitalizes every token long enough to be a noun', () => {
    expect(normalizeQuery('drohnen raffinerie')).toBe('Drohnen Raffinerie');
    expect(normalizeQuery('pkw unfall')).toBe('Pkw Unfall');
    expect(normalizeQuery('sanktionen gegen russland')).toBe('Sanktionen Gegen Russland');
  });

  it('leaves short lowercase tokens as typed, so acronyms survive', () => {
    expect(normalizeQuery('fussball wm')).toBe('Fussball wm');
    expect(normalizeQuery('eu gipfel')).toBe('Eu Gipfel');
  });

  it('does not upper-case a short lowercase token', () => {
    expect(normalizeQuery('orf')).toBe('Orf');
  });

  it('leaves a short ALL-CAPS token alone, because it reads as an acronym', () => {
    expect(normalizeQuery('ORF')).toBe('ORF');
    expect(normalizeQuery('ÖFB')).toBe('ÖFB');
    expect(normalizeQuery('EU')).toBe('EU');
    expect(normalizeQuery('NATO')).toBe('NATO');
  });

  it('preserves the longest real acronyms in the corpus', () => {
    expect(normalizeQuery('ASFINAG')).toBe('ASFINAG');
    expect(normalizeQuery('STRABAG')).toBe('STRABAG');
    expect(normalizeQuery('UNESCO')).toBe('UNESCO');
    expect(normalizeQuery('ÖAMTC')).toBe('ÖAMTC');
    expect(normalizeQuery('KELAG')).toBe('KELAG');
  });

  it('lowercases a long ALL-CAPS token, because it reads as shouting', () => {
    expect(normalizeQuery('TEUERUNG')).toBe('Teuerung');
    expect(normalizeQuery('HOCHWASSER')).toBe('Hochwasser');
    expect(normalizeQuery('KLIMASCHUTZ')).toBe('Klimaschutz');
  });

  it('decides ALL-CAPS per token, so an acronym survives next to a shouted word', () => {
    expect(normalizeQuery('FUSSBALL WM')).toBe('Fussball WM');
    expect(normalizeQuery('ORF HOCHWASSER')).toBe('ORF hochwasser');
  });

  it('still preserves an all-caps ordinary word in the 6-7 overlap', () => {
    expect(normalizeQuery('WETTER')).toBe('WETTER');
  });

  it('leaves a mixed-case query alone, because the casing is a signal', () => {
    expect(normalizeQuery('Russland')).toBe('Russland');
    expect(normalizeQuery('iPhone')).toBe('iPhone');
    expect(normalizeQuery('ÖBB Streik')).toBe('ÖBB Streik');
  });

  it('handles umlauts as the first letter', () => {
    expect(normalizeQuery('öbb streik')).toBe('Öbb Streik');
  });

  it('collapses surrounding and repeated whitespace', () => {
    expect(normalizeQuery('  ukraine   krieg  ')).toBe('Ukraine Krieg');
  });

  it('is idempotent, so a normalized query keeps the same cache key', () => {
    for (const query of ['russland', 'RUSSLAND', 'ORF', 'FUSSBALL WM', 'drohnen raffinerie', 'iPhone']) {
      expect(normalizeQuery(normalizeQuery(query))).toBe(normalizeQuery(query));
    }
  });

  it('maps queries that differ only in casing onto one cache key', () => {
    expect(new Set(['russland', 'RUSSLAND', 'Russland'].map(normalizeQuery)).size).toBe(1);
  });

  it('leaves a query with no letters untouched', () => {
    expect(normalizeQuery('2024')).toBe('2024');
  });
});

describe('EmbeddingService', () => {
  function fakeEmbedding(dimensions: number) {
    return Array.from({ length: dimensions }, (_, index) => (index % 2 === 0 ? 1 : -1) * (index + 1));
  }

  function stubEmbeddingServer(dimensions: number) {
    const requests: Array<string | undefined> = [];
    const httpClient = HttpClient.make((request) =>
      Effect.sync(() => {
        requests.push(request.body._tag === 'Uint8Array' ? request.body.text : undefined);
        const response = JSON.stringify({ data: [{ embedding: fakeEmbedding(dimensions) }] });
        return HttpClientResponse.fromWeb(request, new Response(response));
      }),
    );
    const layer = EmbeddingService.layerWithoutDependencies.pipe(
      Layer.provide(Layer.succeed(HttpClient.HttpClient, httpClient)),
      Layer.provide(RateLimiter.layer.pipe(Layer.provide(RateLimiter.layerStoreMemory))),
    );
    return { requests, layer };
  }

  it.effect('returns title and content vectors from one request and caches the pair', () => {
    const { requests, layer } = stubEmbeddingServer(768);

    return Effect.gen(function* () {
      const embeddingService = yield* EmbeddingService;
      const first = yield* embeddingService.embedQuery('teuerung', 'client-1');
      const second = yield* embeddingService.embedQuery('Teuerung', 'client-1');

      const values = fakeEmbedding(768);
      expect(requests).toEqual([JSON.stringify({ input: ['task: search result | query: Teuerung'] })]);
      expect(first.title).toEqual(quantize(values.slice(0, 256)));
      expect(first.content).toEqual(quantize(values.slice(0, 512)));
      expect(second).toBe(first);
    }).pipe(Effect.provide(layer));
  });

  it.effect('rejects a vector shorter than the content dimensions as malformed', () => {
    const { layer } = stubEmbeddingServer(256);

    return Effect.gen(function* () {
      const embeddingService = yield* EmbeddingService;
      const error = yield* Effect.flip(embeddingService.embedQuery('Teuerung', 'client-1'));

      expect(error).toBeInstanceOf(EmbeddingError);
      expect(error.type).toBe('malformed');
      expect(error.message).toBe('Expected at least 512 dimensions, got 256.');
    }).pipe(Effect.provide(layer));
  });
});
