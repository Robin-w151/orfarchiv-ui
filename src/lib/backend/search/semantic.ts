import { ORFARCHIV_SEMANTIC_CONTENT_ENABLED } from '$app/env/private';
import {
  CONTENT_EMBEDDING_FIELD,
  NEWS_TITLE_VECTOR_INDEX,
  TITLE_EMBEDDING_FIELD,
} from '#common/search/search.constants.ts';
import type { Target } from '#common/targets/targets.ts';
import { DatabaseService, type DatabaseServiceShape } from '#lib/backend/db/database.ts';
import {
  SEMANTIC_SEARCH_CANDIDATE_LIMIT,
  SEMANTIC_SEARCH_CATEGORY_CACHE_TTL,
  SEMANTIC_SEARCH_CONTENT_MIN_SCORE,
  SEMANTIC_SEARCH_CONTENT_WEIGHT,
  SEMANTIC_SEARCH_TITLE_MIN_SCORE,
  SEMANTIC_SEARCH_NUM_CANDIDATES,
  SEMANTIC_SEARCH_RECENCY_DECAY_MS,
  SEMANTIC_SEARCH_RECENCY_WEIGHT,
  SEMANTIC_SEARCH_TITLE_WEIGHT,
  logger,
} from '#lib/configs/server.ts';
import { NEWS_QUERY_PAGE_LIMIT } from '#lib/configs/shared.ts';
import type { EmbeddingError, SearchError } from '#lib/errors/errors.ts';
import type { News } from '#lib/models/news.ts';
import type { SearchRequestParameters, SemanticSearchRequestParameters } from '#lib/models/searchRequest.ts';
import type { StoryEntity } from '#lib/models/story.ts';
import { Context, Effect, Layer } from 'effect';
import type { Binary, Collection } from 'mongodb';
import { EmbeddingService, type EmbeddingServiceShape, type QueryVectors } from './embedding';
import { escapeRegExp, isStoryEntity, mapToStory, parseDate } from './shared';

const FusionPipeline = {
  Title: 'title',
  Content: 'content',
} as const;
type FusionPipeline = (typeof FusionPipeline)[keyof typeof FusionPipeline];

type VectorFilter = Record<string, unknown>;

interface Vocabulary {
  categories: Array<string>;
  sources: Array<string>;
}

export type SemanticSearchServiceShape = Context.Service.Shape<typeof SemanticSearchService>;
export class SemanticSearchService extends Context.Service<SemanticSearchService>()('search/SemanticSearchService', {
  make: Effect.gen(function* () {
    const database = yield* DatabaseService;
    const embeddingService = yield* EmbeddingService;
    const [cachedVocabulary, invalidateVocabulary] = yield* Effect.cachedInvalidateWithTTL(
      fetchVocabulary(database),
      SEMANTIC_SEARCH_CATEGORY_CACHE_TTL,
    );
    const getVocabulary = cachedVocabulary.pipe(Effect.tapError(() => invalidateVocabulary));

    return defineService({ database, embeddingService, getVocabulary });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(Layer.provide(EmbeddingService.layer));
}

function fetchVocabulary(database: DatabaseServiceShape): Effect.Effect<Vocabulary, SearchError> {
  return database.useNewsCollection('Failed to read the category vocabulary.', async (newsCollection) => {
    const [categories, sources] = await Promise.all([
      newsCollection.distinct('category'),
      newsCollection.distinct('source'),
    ]);
    return {
      categories: categories.filter((entry): entry is string => !!entry),
      sources: sources.filter((entry): entry is string => !!entry),
    } satisfies Vocabulary;
  });
}

function defineService({
  database,
  embeddingService,
  getVocabulary,
}: {
  database: DatabaseServiceShape;
  embeddingService: EmbeddingServiceShape;
  getVocabulary: Effect.Effect<Vocabulary, SearchError>;
}) {
  function searchNews(
    searchRequestParameters: SemanticSearchRequestParameters,
    clientId: string,
  ): Effect.Effect<News, SearchError | EmbeddingError> {
    return Effect.gen(function* () {
      const { textFilter, tag, dateFilter, sources } = searchRequestParameters;
      const queryVectors = yield* embeddingService.embedQuery(textFilter, clientId);
      const filter = yield* buildVectorFilter({ tag, dateFilter, sources });
      if (!filter) {
        return { stories: [], ordering: 'relevance', prevKey: null, nextKey: null } satisfies News;
      }

      const stories = yield* database.useNewsCollection(
        'Failed to search news semantically.',
        (newsCollection, target) =>
          isFusedSearchEnabled(target)
            ? searchFused(newsCollection, target, queryVectors, filter)
            : searchByTitle(newsCollection, queryVectors.title, filter),
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
    VectorFilter | undefined,
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

  const warnedTargets = new Set<string>();

  async function searchFused(
    newsCollection: Collection<Document>,
    target: Target,
    queryVectors: QueryVectors,
    filter: VectorFilter,
  ) {
    try {
      return await (newsCollection.aggregate(buildFusedPipeline(queryVectors, filter)).toArray() as unknown as Promise<
        Array<StoryEntity>
      >);
    } catch (error) {
      if (!isMissingVectorPathError(error)) {
        throw error;
      }
      if (!warnedTargets.has(target.label)) {
        warnedTargets.add(target.label);
        logger.warn(
          `Database target '${target.label}' has no content vectors, falling back to title-only search. ` +
            'Check ORFARCHIV_CONTENT_EMBEDDING_EXCLUDED_TARGETS.',
        );
      }
      return searchByTitle(newsCollection, queryVectors.title, filter);
    }
  }

  return { searchNews } as const;
}

function isFusedSearchEnabled(target: Target) {
  return ORFARCHIV_SEMANTIC_CONTENT_ENABLED === 'true' && target.content;
}

function isMissingVectorPathError(error: unknown) {
  return error instanceof Error && error.message.includes('is not indexed as vector');
}

function searchByTitle(newsCollection: Collection<Document>, queryVector: Binary, filter: VectorFilter) {
  return newsCollection.aggregate(buildTitlePipeline(queryVector, filter)).toArray() as unknown as Promise<
    Array<StoryEntity>
  >;
}

function buildTitlePipeline(queryVector: Binary, filter: VectorFilter) {
  return [
    vectorSearchStage(TITLE_EMBEDDING_FIELD, queryVector, filter),
    { $addFields: { score: { $meta: 'vectorSearchScore' } } },
    { $match: { score: { $gte: SEMANTIC_SEARCH_TITLE_MIN_SCORE }, title: { $gt: '' } } },
    ...rankStages('$score'),
  ];
}

function buildFusedPipeline(queryVectors: QueryVectors, filter: VectorFilter) {
  return [
    {
      $rankFusion: {
        input: {
          pipelines: {
            [FusionPipeline.Title]: [
              vectorSearchStage(TITLE_EMBEDDING_FIELD, queryVectors.title, filter),
              { $match: { title: { $gt: '' } } },
            ],
            [FusionPipeline.Content]: [
              vectorSearchStage(CONTENT_EMBEDDING_FIELD, queryVectors.content, filter),
              { $match: { title: { $gt: '' } } },
            ],
          },
        },
        combination: {
          weights: {
            [FusionPipeline.Title]: SEMANTIC_SEARCH_TITLE_WEIGHT,
            [FusionPipeline.Content]: SEMANTIC_SEARCH_CONTENT_WEIGHT,
          },
        },
        scoreDetails: true,
      },
    },
    { $addFields: { fusedScore: { $meta: 'score' }, details: { $meta: 'scoreDetails' } } },
    {
      $addFields: {
        titleScore: pipelineScore(FusionPipeline.Title),
        contentScore: pipelineScore(FusionPipeline.Content),
      },
    },
    {
      $match: {
        $expr: {
          $or: [
            { $gte: ['$titleScore', SEMANTIC_SEARCH_TITLE_MIN_SCORE] },
            { $gte: ['$contentScore', SEMANTIC_SEARCH_CONTENT_MIN_SCORE] },
          ],
        },
      },
    },
    ...rankStages('$fusedScore', { timestamp: -1, _id: -1 }),
    { $project: { [TITLE_EMBEDDING_FIELD]: 0, [CONTENT_EMBEDDING_FIELD]: 0, details: 0 } },
  ];
}

function vectorSearchStage(path: string, queryVector: Binary, filter: VectorFilter) {
  return {
    $vectorSearch: {
      index: NEWS_TITLE_VECTOR_INDEX,
      path,
      queryVector,
      numCandidates: SEMANTIC_SEARCH_NUM_CANDIDATES,
      limit: SEMANTIC_SEARCH_CANDIDATE_LIMIT,
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
    },
  };
}

function pipelineScore(pipeline: FusionPipeline) {
  return {
    $ifNull: [
      {
        $first: {
          $map: {
            input: { $filter: { input: '$details.details', cond: { $eq: ['$$this.inputPipelineName', pipeline] } } },
            in: '$$this.value',
          },
        },
      },
      0,
    ],
  };
}

function rankStages(scoreField: string, tieBreaker: Record<string, 1 | -1> = {}) {
  return [
    {
      $addFields: {
        rankScore: {
          $multiply: [
            scoreField,
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
    { $sort: { rankScore: -1, ...tieBreaker } },
    { $limit: NEWS_QUERY_PAGE_LIMIT },
  ];
}
