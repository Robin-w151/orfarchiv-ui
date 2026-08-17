import { searchStory } from '$lib/backend/db/news';
import { MetaDataNotFoundError } from '$lib/errors/errors';
import { Context, Effect, Layer, Predicate } from 'effect';

const SOURCE_URL_REGEXP = /^https:\/\/(?<source>\w+)\.orf\.at/i;

export class MetaDataService extends Context.Service<MetaDataService>()('content/MetaDataService', {
  make: Effect.succeed({
    fetchStoryMetadata,
    findSourceFromUrl,
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function fetchStoryMetadata(url: string, includeOesterreichSource = false) {
  return Effect.tryPromise({
    try: () => searchStory(url, { includeOesterreichSource }),
    catch: (cause) =>
      new MetaDataNotFoundError({
        url,
        tags: [
          ['url', url],
          ['cause', (cause as Error).message],
        ],
        cause,
      }),
  }).pipe(Effect.filterOrFail(Predicate.isNotNullish, () => new MetaDataNotFoundError({ url, tags: [['url', url]] })));
}

function findSourceFromUrl(url: string): string | undefined {
  return SOURCE_URL_REGEXP.exec(url)?.groups?.source;
}
