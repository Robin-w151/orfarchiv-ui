import { DatabaseService, type DatabaseServiceShape } from '$lib/backend/db/database';
import { logger } from '$lib/configs/server';
import type { SearchError } from '$lib/errors/errors';
import type { News, NewsUpdates } from '$lib/models/news';
import type {
  SearchRequest,
  SearchRequestParameters,
  SemanticSearchRequestParameters,
} from '$lib/models/searchRequest';
import type { SearchStoryOptions, Story } from '$lib/models/story';
import { Context, Effect, Layer, ManagedRuntime } from 'effect';
import { isEmbeddingConfigured } from './embedding';
import { KeywordSearchService, type KeywordSearchServiceShape } from './keyword';
import { SemanticSearchService, type SemanticSearchServiceShape } from './semantic';
import { isStoryEntity, mapToStory } from './shared';

export class NewsSearchService extends Context.Service<NewsSearchService>()('search/NewsSearchService', {
  make: Effect.gen(function* () {
    const database = yield* DatabaseService;
    const keywordSearchService = yield* KeywordSearchService;
    const semanticSearchService = yield* SemanticSearchService;
    return defineService({ database, keywordSearchService, semanticSearchService });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(
    Layer.provide(KeywordSearchService.layerWithoutDependencies),
    Layer.provide(SemanticSearchService.layer),
    Layer.provide(DatabaseService.layer),
  );
}

function defineService({
  database,
  keywordSearchService,
  semanticSearchService,
}: {
  database: DatabaseServiceShape;
  keywordSearchService: KeywordSearchServiceShape;
  semanticSearchService: SemanticSearchServiceShape;
}) {
  function searchNews(searchRequest: SearchRequest, clientId = 'anonymous'): Effect.Effect<News, SearchError> {
    return Effect.gen(function* () {
      logger.info(`Search news with request='${JSON.stringify(searchRequest)}'`);

      const { searchRequestParameters } = searchRequest;
      if (isSemanticSearch(searchRequestParameters)) {
        return yield* semanticSearchService.searchNews(searchRequestParameters, clientId).pipe(
          Effect.catchTag('EmbeddingError', (error) =>
            Effect.gen(function* () {
              logger.warn(`Semantic search unavailable, falling back to keyword search: ${error.message}`);
              return yield* keywordSearchService.searchNews({
                searchRequestParameters: { ...searchRequestParameters, matchMode: 'anyOf' },
              });
            }),
          ),
        );
      } else {
        const keywordSearchRequest = {
          ...searchRequest,
          searchRequestParameters: {
            ...searchRequest.searchRequestParameters,
            matchMode:
              searchRequest.searchRequestParameters.matchMode === 'semantic'
                ? 'anyOf'
                : searchRequest.searchRequestParameters.matchMode,
          },
        };
        return yield* keywordSearchService.searchNews(keywordSearchRequest);
      }
    });
  }

  function checkNewsUpdatesAvailable(searchRequest: SearchRequest): Effect.Effect<NewsUpdates, SearchError> {
    return Effect.gen(function* () {
      logger.info(`Check if news updates with request='${JSON.stringify(searchRequest)}' are available`);

      if (searchRequest.pageKey?.type !== 'prev' || isSemanticSearch(searchRequest.searchRequestParameters)) {
        return { updateAvailable: false };
      }

      const news = yield* searchNews(searchRequest);
      return { updateAvailable: news.stories.length > 0 };
    });
  }

  function searchStory(url: string, options?: SearchStoryOptions): Effect.Effect<Story | undefined, SearchError> {
    return Effect.gen(function* () {
      logger.info(`Search story with url='${url}'`);

      const { includeOesterreichSource = false } = options ?? {};
      const query: { url: string; source?: unknown } = { url, source: { $ne: 'oesterreich' } };
      if (includeOesterreichSource) {
        delete query.source;
      }

      const story = yield* database.useNewsCollection(`Failed to search story with url='${url}'.`, (newsCollection) =>
        newsCollection.findOne(query),
      );

      return isStoryEntity(story) ? mapToStory(story) : undefined;
    });
  }

  return { searchNews, checkNewsUpdatesAvailable, searchStory } as const;
}

function isSemanticSearch(
  searchRequestParameters: SearchRequestParameters,
): searchRequestParameters is SemanticSearchRequestParameters {
  const { matchMode, textFilter } = searchRequestParameters;
  return matchMode === 'semantic' && !!textFilter?.trim() && isEmbeddingConfigured();
}

const SearchLive = NewsSearchService.layer;
const runtime = ManagedRuntime.make(SearchLive);

export function searchNews(searchRequest: SearchRequest, clientId?: string): Promise<News> {
  return runtime.runPromise(
    Effect.gen(function* () {
      const service = yield* NewsSearchService;
      return yield* service.searchNews(searchRequest, clientId);
    }),
  );
}

export function checkNewsUpdatesAvailable(searchRequest: SearchRequest): Promise<NewsUpdates> {
  return runtime.runPromise(
    Effect.gen(function* () {
      const service = yield* NewsSearchService;
      return yield* service.checkNewsUpdatesAvailable(searchRequest);
    }),
  );
}

export function searchStory(url: string, options?: SearchStoryOptions): Promise<Story | undefined> {
  return runtime.runPromise(
    Effect.gen(function* () {
      const service = yield* NewsSearchService;
      return yield* service.searchStory(url, options);
    }),
  );
}
