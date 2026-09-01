import {
  ORFARCHIV_EMBEDDING_RATE_LIMIT,
  ORFARCHIV_EMBEDDING_RATE_WINDOW,
  ORFARCHIV_EMBEDDING_TOKEN,
  ORFARCHIV_EMBEDDING_URL,
} from '$app/env/private';
import {
  SEMANTIC_SEARCH_ACRONYM_MAX_LENGTH,
  SEMANTIC_SEARCH_MIN_NOUN_LENGTH,
  SEMANTIC_SEARCH_CACHE_MAX,
  SEMANTIC_SEARCH_CACHE_TTL,
  SEMANTIC_SEARCH_TIMEOUT,
  NEWS_TITLE_EMBEDDING_DIMENSIONS,
} from '$lib/configs/server';
import { EmbeddingError } from '$lib/errors/errors';
import { EmbeddingResponse } from '$lib/models/embedding';
import { Context, Duration, Effect, Layer } from 'effect';
import { FetchHttpClient, HttpBody, HttpClient, HttpClientRequest, HttpClientResponse } from 'effect/unstable/http';
import { RateLimiter } from 'effect/unstable/persistence';
import { LRUCache } from 'lru-cache';
import { Binary } from 'mongodb';

export type EmbeddingServiceShape = Context.Service.Shape<typeof EmbeddingService>;
export class EmbeddingService extends Context.Service<EmbeddingService>()('search/EmbeddingService', {
  make: Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;
    const withLimiter = yield* RateLimiter.makeWithRateLimiter;
    return defineService({ httpClient, withLimiter });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(
    Layer.provide(FetchHttpClient.layer),
    Layer.provide(RateLimiter.layer.pipe(Layer.provide(RateLimiter.layerStoreMemory))),
  );
}

function defineService({
  httpClient,
  withLimiter,
}: {
  httpClient: HttpClient.HttpClient;
  withLimiter: Effect.Success<typeof RateLimiter.makeWithRateLimiter>;
}) {
  const cache = new LRUCache<string, Binary>({ max: SEMANTIC_SEARCH_CACHE_MAX, ttl: SEMANTIC_SEARCH_CACHE_TTL });

  function embedQuery(text: string, clientId: string): Effect.Effect<Binary, EmbeddingError> {
    return Effect.gen(function* () {
      const key = normalizeQuery(text);
      const cached = cache.get(key);
      if (cached) {
        return cached;
      }

      const embedding = yield* requestEmbedding(key).pipe(
        withLimiter({
          key: `embeddings:${clientId}`,
          algorithm: 'token-bucket',
          onExceeded: 'delay',
          window: (ORFARCHIV_EMBEDDING_RATE_WINDOW ?? '1 minute') as Duration.Input,
          limit: Number.parseInt(ORFARCHIV_EMBEDDING_RATE_LIMIT ?? '60'),
        }),
        Effect.catchTag(
          'RateLimiterError',
          (error) => new EmbeddingError({ message: 'Rate limiting failed.', type: 'unreachable', cause: error }),
        ),
        Effect.timeout(SEMANTIC_SEARCH_TIMEOUT),
        Effect.catchTag(
          'TimeoutError',
          (error) => new EmbeddingError({ message: 'Embedding request timed out.', type: 'timeout', cause: error }),
        ),
      );

      cache.set(key, embedding);
      return embedding;
    });
  }

  function requestEmbedding(input: string): Effect.Effect<Binary, EmbeddingError> {
    return Effect.gen(function* () {
      if (!ORFARCHIV_EMBEDDING_URL) {
        return yield* new EmbeddingError({
          message: 'ORFARCHIV_EMBEDDING_URL is not configured.',
          type: 'rejected',
        });
      }

      const requestUrl = new URL('embeddings', ORFARCHIV_EMBEDDING_URL + '/').href;
      let request = HttpClientRequest.post(requestUrl, {
        body: HttpBody.jsonUnsafe({ input: [toQueryInput(input)] }),
      });
      if (ORFARCHIV_EMBEDDING_TOKEN) {
        request = HttpClientRequest.bearerToken(request, ORFARCHIV_EMBEDDING_TOKEN);
      }

      const response = yield* httpClient
        .execute(request)
        .pipe(
          Effect.mapError(
            (error) =>
              new EmbeddingError({ message: 'Embedding server is unreachable.', type: 'unreachable', cause: error }),
          ),
        );

      if (response.status < 200 || response.status >= 300) {
        return yield* new EmbeddingError({
          message: `Embedding server rejected the request with status ${response.status}.`,
          type: 'rejected',
        });
      }

      const parsed = yield* HttpClientResponse.schemaBodyJson(EmbeddingResponse)(response).pipe(
        Effect.mapError(
          (error) =>
            new EmbeddingError({ message: 'Embedding response was malformed.', type: 'malformed', cause: error }),
        ),
      );

      const values = parsed.data[0]?.embedding;
      if (!values || values.length < NEWS_TITLE_EMBEDDING_DIMENSIONS) {
        return yield* new EmbeddingError({
          message: `Expected at least ${NEWS_TITLE_EMBEDDING_DIMENSIONS} dimensions, got ${values?.length ?? 0}.`,
          type: 'malformed',
        });
      }

      return quantize(values.slice(0, NEWS_TITLE_EMBEDDING_DIMENSIONS));
    });
  }

  return { embedQuery } as const;
}

/**
 * Titles are embedded with their natural German casing, and the model is
 * case-sensitive, so the casing of a query moves its vector. Measured against
 * the full archive: `russland` scores 0.828 at best and clears the 0.80 floor
 * 13 times, while `Russland` scores 0.853 and clears it 262 times — the whole
 * distribution shifts by ~0.025, which is a quarter of the usable 0.096 range.
 *
 * The handling is deliberately asymmetric, because the two cases carry
 * different evidence:
 *
 * - **Mixed case is left alone.** It is a deliberate signal (`iPhone`,
 *   `ÖBB Streik`) rather than an artifact of how someone types.
 * - **All-lowercase is sentence-cased.** Only the first letter: capitalizing
 *   every word is better German and helps some queries (`pkw unfall` reaches
 *   300 results rather than 106), but it mangles acronyms badly enough to lose
 *   outright — `fussball wm` becomes `Fussball Wm` and collapses from 300 to 31.
 *   Short lowercase tokens are *not* upper-cased to rescue `orf`: a lowercase
 *   token is no evidence of an acronym, and uppercasing ordinary short nouns is
 *   ruinous — `wald` 300 → 0, `markt` 248 → 0, `geld` 118 → 0.
 * - **ALL-CAPS is split per token.** A token up to
 *   SEMANTIC_QUERY_ACRONYM_MAX_LENGTH is read as an acronym and preserved; a
 *   longer one is a shouted word and lowercased. Sentence-casing the whole
 *   string destroyed acronyms outright: `ORF` 90 → 0 and `ÖFB` 300 → 0 results,
 *   with `FPÖ` 300 → 20 and `EU` 300 → 142. Preserving everything instead would
 *   re-break shouted words, which is what the sentence-casing was introduced
 *   for (`TEUERUNG` returns nothing as typed, 152 lowercased). The length
 *   boundary is measured against the corpus — see the constant. Per token
 *   rather than per query because `FUSSBALL WM` has to keep its acronym:
 *   `Fussball WM` returns 300 where `FUSSBALL WM` returns 7.
 */
export function normalizeQuery(query: string): string {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  const hasUpper = /\p{Lu}/u.test(trimmed);
  const hasLower = /\p{Ll}/u.test(trimmed);
  if (hasUpper && hasLower) {
    return trimmed;
  }
  if (!hasUpper) {
    return trimmed
      .split(' ')
      .map((token, index) =>
        index === 0 || token.length >= SEMANTIC_SEARCH_MIN_NOUN_LENGTH ? capitalize(token) : token,
      )
      .join(' ');
  }

  const perToken = trimmed
    .split(' ')
    .map((token) => (token.length <= SEMANTIC_SEARCH_ACRONYM_MAX_LENGTH ? token : token.toLowerCase()))
    .join(' ');
  return capitalize(perToken);
}

function capitalize(text: string): string {
  return text.replace(/\p{L}/u, (letter) => letter.toUpperCase());
}

/**
 * Matryoshka truncation, then per-vector max-abs scaling to int8. Cosine is
 * scale-invariant so the factor cancels and need not be stored. Must stay
 * identical to the scraper's quantize().
 */
export function quantize(values: ReadonlyArray<number>): Binary {
  let maxAbs = 0;
  for (const value of values) {
    const abs = Math.abs(value);
    if (abs > maxAbs) {
      maxAbs = abs;
    }
  }

  const scale = maxAbs === 0 ? 0 : 127 / maxAbs;
  const quantized = Int8Array.from(values, (value) => Math.max(-127, Math.min(127, Math.round(value * scale))));
  return Binary.fromInt8Array(quantized);
}

export function isEmbeddingConfigured(): boolean {
  return !!ORFARCHIV_EMBEDDING_URL;
}

function toQueryInput(query: string): string {
  return `task: search result | query: ${query}`;
}
