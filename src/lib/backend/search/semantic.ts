import {
  NEWS_TITLE_VECTOR_INDEX,
  SEMANTIC_SEARCH_CANDIDATE_LIMIT,
  SEMANTIC_SEARCH_CATEGORY_CACHE_TTL,
  SEMANTIC_SEARCH_MIN_SCORE,
  SEMANTIC_SEARCH_NUM_CANDIDATES,
  SEMANTIC_SEARCH_RECENCY_DECAY_MS,
  SEMANTIC_SEARCH_RECENCY_WEIGHT,
  NEWS_TITLE_EMBEDDING_FIELD,
} from '$lib/configs/server';
import { NEWS_QUERY_PAGE_LIMIT } from '$lib/configs/shared';
import type { EmbeddingError, SearchError } from '$lib/errors/errors';
import type { News } from '$lib/models/news';
import type { SearchRequestParameters, SemanticSearchRequestParameters } from '$lib/models/searchRequest';
import type { StoryEntity } from '$lib/models/story';
import { Context, Effect, Layer } from 'effect';
import { EmbeddingService, type EmbeddingServiceShape } from './embedding';
import { escapeRegExp, isStoryEntity, mapToStory, parseDate, useNewsCollection } from './shared';

interface Vocabulary {
  categories: Array<string>;
  sources: Array<string>;
}

export type SemanticSearchServiceShape = Context.Service.Shape<typeof SemanticSearchService>;
export class SemanticSearchService extends Context.Service<SemanticSearchService>()('search/SemanticSearchService', {
  make: Effect.gen(function* () {
    const embeddingService = yield* EmbeddingService;
    const [cachedVocabulary, invalidateVocabulary] = yield* Effect.cachedInvalidateWithTTL(
      fetchVocabulary,
      SEMANTIC_SEARCH_CATEGORY_CACHE_TTL,
    );
    const getVocabulary = cachedVocabulary.pipe(Effect.tapError(() => invalidateVocabulary));

    return defineService({ embeddingService, getVocabulary });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(Layer.provide(EmbeddingService.layer));
}

const fetchVocabulary: Effect.Effect<Vocabulary, SearchError> = useNewsCollection(
  'Failed to read the category vocabulary.',
  async (newsCollection) => {
    const [categories, sources] = await Promise.all([
      newsCollection.distinct('category'),
      newsCollection.distinct('source'),
    ]);
    return {
      categories: categories.filter((entry): entry is string => !!entry),
      sources: sources.filter((entry): entry is string => !!entry),
    } satisfies Vocabulary;
  },
);

function defineService({
  embeddingService,
  getVocabulary,
}: {
  embeddingService: EmbeddingServiceShape;
  getVocabulary: Effect.Effect<Vocabulary, SearchError>;
}) {
  function searchNews(
    searchRequestParameters: SemanticSearchRequestParameters,
    clientId: string,
  ): Effect.Effect<News, SearchError | EmbeddingError> {
    return Effect.gen(function* () {
      const { textFilter, tag, dateFilter, sources } = searchRequestParameters;
      const queryVector = yield* embeddingService.embedQuery(textFilter, clientId);
      const filter = yield* buildVectorFilter({ tag, dateFilter, sources });
      if (!filter) {
        return { stories: [], ordering: 'relevance', prevKey: null, nextKey: null } satisfies News;
      }

      const stories = yield* useNewsCollection(
        'Failed to search news semantically.',
        (newsCollection) =>
          newsCollection
            .aggregate([
              {
                $vectorSearch: {
                  index: NEWS_TITLE_VECTOR_INDEX,
                  path: NEWS_TITLE_EMBEDDING_FIELD,
                  queryVector,
                  numCandidates: SEMANTIC_SEARCH_NUM_CANDIDATES,
                  limit: SEMANTIC_SEARCH_CANDIDATE_LIMIT,
                  ...(Object.keys(filter).length > 0 ? { filter } : {}),
                },
              },
              { $addFields: { score: { $meta: 'vectorSearchScore' } } },
              { $match: { score: { $gte: SEMANTIC_SEARCH_MIN_SCORE }, title: { $gt: '' } } },
              {
                $addFields: {
                  rankScore: {
                    $multiply: [
                      '$score',
                      {
                        $add: [
                          1,
                          {
                            $multiply: [
                              SEMANTIC_SEARCH_RECENCY_WEIGHT,
                              {
                                $exp: {
                                  $divide: [{ $subtract: ['$timestamp', '$$NOW'] }, SEMANTIC_SEARCH_RECENCY_DECAY_MS],
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              { $sort: { rankScore: -1 } },
              { $limit: NEWS_QUERY_PAGE_LIMIT },
            ])
            .toArray() as unknown as Promise<Array<StoryEntity>>,
      );

      return {
        stories: stories.filter((story) => isStoryEntity(story)).map((story) => mapToStory(story)),
        ordering: 'relevance',
        prevKey: null,
        nextKey: null,
      };
    });
  }

  function buildVectorFilter({
    tag,
    dateFilter,
    sources,
  }: Pick<SearchRequestParameters, 'tag' | 'dateFilter' | 'sources'>): Effect.Effect<
    Record<string, unknown> | undefined,
    SearchError
  > {
    return Effect.gen(function* () {
      const conditions: Array<Record<string, unknown>> = [];

      const fromDate = parseDate(dateFilter?.from);
      const toDate = parseDate(dateFilter?.to);
      if (fromDate) {
        conditions.push({ timestamp: { $gte: fromDate } });
      }
      if (toDate) {
        conditions.push({ timestamp: { $lte: toDate } });
      }
      if (sources?.length) {
        conditions.push({ source: { $in: sources } });
      }

      if (tag) {
        const tagRegex = new RegExp(escapeRegExp(tag), 'i');
        const { categories, sources: allSources } = yield* getVocabulary;
        const matchedCategories = categories.filter((category) => tagRegex.test(category));
        const matchedSources = allSources.filter((source) => tagRegex.test(source));

        if (matchedCategories.length === 0 && matchedSources.length === 0) {
          return undefined;
        }

        const tagConditions: Array<Record<string, unknown>> = [];
        if (matchedCategories.length > 0) {
          tagConditions.push({ category: { $in: matchedCategories } });
        }
        if (matchedSources.length > 0) {
          tagConditions.push({ source: { $in: matchedSources } });
        }
        conditions.push(tagConditions.length === 1 ? tagConditions[0] : { $or: tagConditions });
      }

      if (conditions.length === 0) {
        return {};
      }
      return conditions.length === 1 ? conditions[0] : { $and: conditions };
    });
  }

  return { searchNews } as const;
}
