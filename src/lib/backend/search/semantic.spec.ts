import type { Target } from '#common/targets/targets.ts';
import { DatabaseService, type DatabaseServiceShape } from '#lib/backend/db/database.ts';
import { logger } from '#lib/configs/server.ts';
import { SearchError } from '#lib/errors/errors.ts';
import type { SemanticSearchRequestParameters } from '#lib/models/searchRequest.ts';
import type { StoryEntity } from '#lib/models/story.ts';
import { it } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { Binary, type Collection } from 'mongodb';
import { beforeEach, describe, expect, vi } from 'vitest';
import { EmbeddingService, type EmbeddingServiceShape } from './embedding';
import { SemanticSearchService } from './semantic';

const { env } = vi.hoisted(() => ({ env: { contentEnabled: undefined as string | undefined } }));

vi.mock('$app/env/private', () => ({
  get ORFARCHIV_SEMANTIC_CONTENT_ENABLED() {
    return env.contentEnabled;
  },
}));

vi.mock('#lib/configs/server.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#lib/configs/server.ts')>()),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const TITLE_VECTOR = Binary.fromInt8Array(new Int8Array(256).fill(1));
const CONTENT_VECTOR = Binary.fromInt8Array(new Int8Array(512).fill(2));

const CONTENT_TARGET: Target = { url: 'mongodb://db-1', label: 'db-1', content: true };
const EXCLUDED_TARGET: Target = { url: 'mongodb://db-2', label: 'db-2', content: false };

const STORY: StoryEntity = {
  _id: 1,
  id: 'news:1',
  title: 'Story 1',
  category: 'Chronik',
  url: 'https://orf.at/stories/1/',
  timestamp: new Date(Date.UTC(2026, 0, 1)),
  source: 'news',
};

type Pipeline = Array<Record<string, unknown>>;

function rankScoreStage(scoreField: string) {
  return {
    $addFields: {
      rankScore: {
        $multiply: [
          scoreField,
          {
            $add: [
              1,
              {
                $multiply: [
                  0,
                  { $exp: { $divide: [{ $subtract: ['$timestamp', '$$NOW'] }, 30 * 24 * 60 * 60 * 1000] } },
                ],
              },
            ],
          },
        ],
      },
    },
  };
}

function titleOnlyPipeline(filter?: Record<string, unknown>): Pipeline {
  return [
    {
      $vectorSearch: {
        index: 'news_title_vector',
        path: 'titleEmbedding',
        queryVector: TITLE_VECTOR,
        numCandidates: 3000,
        limit: 300,
        ...(filter ? { filter } : {}),
      },
    },
    { $addFields: { score: { $meta: 'vectorSearchScore' } } },
    { $match: { score: { $gte: 0.79 }, title: { $gt: '' } } },
    rankScoreStage('$score'),
    { $sort: { rankScore: -1 } },
    { $limit: 100 },
  ];
}

function stubServices({
  targets = [CONTENT_TARGET],
  failingTargets = [],
  fusedFailure,
}: {
  targets?: Array<Target>;
  failingTargets?: Array<string>;
  fusedFailure?: Error;
} = {}) {
  const pipelines: Array<Pipeline> = [];
  const embedQueries: Array<string> = [];

  const collection = {
    aggregate: (pipeline: Pipeline) => {
      pipelines.push(pipeline);
      return {
        toArray: async () => {
          if (fusedFailure && '$rankFusion' in pipeline[0]) {
            throw fusedFailure;
          }
          return [STORY];
        },
      };
    },
    distinct: async (field: string) => (field === 'category' ? ['Chronik', 'Wirtschaft'] : ['news', 'wien']),
  } as unknown as Collection<Document>;

  const database: DatabaseServiceShape = {
    useNewsCollection: (message, use) =>
      Effect.firstSuccessOf(
        targets.map((target) =>
          Effect.tryPromise({
            try: () =>
              failingTargets.includes(target.label)
                ? Promise.reject(new Error(`connect ECONNREFUSED ${target.url}`))
                : use(collection, target),
            catch: (cause) => cause,
          }),
        ),
      ).pipe(Effect.mapError((cause) => new SearchError({ message, cause }))),
    health: Effect.succeed([]),
  };

  const embedding: EmbeddingServiceShape = {
    embedQuery: (text) => {
      embedQueries.push(text);
      return Effect.succeed({ title: TITLE_VECTOR, content: CONTENT_VECTOR });
    },
  };

  const layer = SemanticSearchService.layerWithoutDependencies.pipe(
    Layer.provide(Layer.succeed(DatabaseService, database)),
    Layer.provide(Layer.succeed(EmbeddingService, embedding)),
  );
  return { pipelines, embedQueries, layer };
}

function search(parameters: Partial<SemanticSearchRequestParameters> = {}) {
  return Effect.gen(function* () {
    const semanticSearchService = yield* SemanticSearchService;
    return yield* semanticSearchService.searchNews(
      { textFilter: 'Teuerung', matchMode: 'semantic', ...parameters } as SemanticSearchRequestParameters,
      'client-1',
    );
  });
}

function vectorSearches(pipeline: Pipeline) {
  const fusion = pipeline[0].$rankFusion as {
    input: { pipelines: Record<string, Pipeline> };
  };
  return Object.fromEntries(
    Object.entries(fusion.input.pipelines).map(([name, subPipeline]) => [
      name,
      subPipeline[0].$vectorSearch as Record<string, unknown>,
    ]),
  );
}

const missingPathError = new Error(
  'Executor error during aggregate command on namespace: orfarchiv.news :: caused by :: contentEmbedding is not indexed as vector',
);

describe('SemanticSearchService', () => {
  beforeEach(() => {
    env.contentEnabled = undefined;
    vi.mocked(logger.warn).mockClear();
  });

  it.effect.each([
    { flag: undefined, target: CONTENT_TARGET },
    { flag: 'false', target: CONTENT_TARGET },
    { flag: 'true', target: EXCLUDED_TARGET },
  ])('runs the unchanged title-only pipeline when flag=$flag on $target.label', ({ flag, target }) => {
    env.contentEnabled = flag;
    const { pipelines, layer } = stubServices({ targets: [target] });

    return Effect.gen(function* () {
      const news = yield* search();

      expect(pipelines).toEqual([titleOnlyPipeline()]);
      expect(news).toEqual({
        stories: [
          {
            id: 'news:1',
            title: 'Story 1',
            category: 'Chronik',
            url: 'https://orf.at/stories/1/',
            timestamp: '2026-01-01T00:00:00.000Z',
            source: 'news',
          },
        ],
        ordering: 'relevance',
        prevKey: null,
        nextKey: null,
      });
      expect(logger.warn).not.toHaveBeenCalled();
    }).pipe(Effect.provide(layer));
  });

  it.effect('fuses title and content search with one embedding when enabled on a content target', () => {
    env.contentEnabled = 'true';
    const { pipelines, embedQueries, layer } = stubServices();

    return Effect.gen(function* () {
      const news = yield* search();

      expect(embedQueries).toEqual(['Teuerung']);
      expect(pipelines).toHaveLength(1);
      expect(news.stories.map((story) => story.id)).toEqual(['news:1']);
      expect(news.ordering).toBe('relevance');

      const [pipeline] = pipelines;
      expect(pipeline[0].$rankFusion).toMatchObject({
        combination: { weights: { title: 1, content: 1 } },
        scoreDetails: true,
      });
      expect(vectorSearches(pipeline)).toEqual({
        title: {
          index: 'news_title_vector',
          path: 'titleEmbedding',
          queryVector: TITLE_VECTOR,
          numCandidates: 3000,
          limit: 300,
        },
        content: {
          index: 'news_title_vector',
          path: 'contentEmbedding',
          queryVector: CONTENT_VECTOR,
          numCandidates: 3000,
          limit: 300,
        },
      });
      expect(pipeline.slice(1, 4)).toEqual([
        { $addFields: { fusedScore: { $meta: 'score' }, details: { $meta: 'scoreDetails' } } },
        {
          $addFields: {
            titleScore: {
              $ifNull: [
                {
                  $first: {
                    $map: {
                      input: {
                        $filter: { input: '$details.details', cond: { $eq: ['$$this.inputPipelineName', 'title'] } },
                      },
                      in: '$$this.value',
                    },
                  },
                },
                0,
              ],
            },
            contentScore: {
              $ifNull: [
                {
                  $first: {
                    $map: {
                      input: {
                        $filter: { input: '$details.details', cond: { $eq: ['$$this.inputPipelineName', 'content'] } },
                      },
                      in: '$$this.value',
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $match: {
            $expr: {
              $or: [{ $gte: ['$titleScore', 0.79] }, { $gte: ['$contentScore', 0.76] }],
            },
          },
        },
      ]);
      expect(pipeline.slice(4)).toEqual([
        rankScoreStage('$fusedScore'),
        { $sort: { rankScore: -1, timestamp: -1, _id: -1 } },
        { $limit: 100 },
        { $project: { titleEmbedding: 0, contentEmbedding: 0, details: 0 } },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect.each([
    {
      name: 'date range',
      parameters: { dateFilter: { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' } },
      filter: {
        $and: [
          { timestamp: { $gte: new Date('2026-01-01T00:00:00.000Z') } },
          { timestamp: { $lte: new Date('2026-02-01T00:00:00.000Z') } },
        ],
      },
    },
    { name: 'sources', parameters: { sources: ['news', 'wien'] }, filter: { source: { $in: ['news', 'wien'] } } },
    { name: 'category tag', parameters: { tag: 'wirtsch' }, filter: { category: { $in: ['Wirtschaft'] } } },
    { name: 'source tag', parameters: { tag: 'wien' }, filter: { source: { $in: ['wien'] } } },
  ])('applies the $name filter identically in both modes', ({ parameters, filter }) => {
    const titleOnly = stubServices();
    const fused = stubServices();

    return Effect.gen(function* () {
      env.contentEnabled = 'false';
      yield* search(parameters).pipe(Effect.provide(titleOnly.layer));
      env.contentEnabled = 'true';
      yield* search(parameters).pipe(Effect.provide(fused.layer));

      expect(titleOnly.pipelines).toEqual([titleOnlyPipeline(filter)]);
      const { title, content } = vectorSearches(fused.pipelines[0]);
      expect(title.filter).toEqual(filter);
      expect(content.filter).toEqual(filter);
    });
  });

  it.effect.each([{ flag: 'false' }, { flag: 'true' }])(
    'returns no stories without querying when a tag matches nothing (flag=$flag)',
    ({ flag }) => {
      env.contentEnabled = flag;
      const { pipelines, layer } = stubServices();

      return Effect.gen(function* () {
        const news = yield* search({ tag: 'unbekannt' });

        expect(news.stories).toEqual([]);
        expect(pipelines).toEqual([]);
      }).pipe(Effect.provide(layer));
    },
  );

  it.effect('falls back to title-only when the content path is missing and warns only once', () => {
    env.contentEnabled = 'true';
    const { pipelines, layer } = stubServices({ fusedFailure: missingPathError });

    return Effect.gen(function* () {
      const first = yield* search();
      const second = yield* search();

      expect(first.stories.map((story) => story.id)).toEqual(['news:1']);
      expect(second.stories.map((story) => story.id)).toEqual(['news:1']);
      expect(pipelines.map((pipeline) => Object.keys(pipeline[0])[0])).toEqual([
        '$rankFusion',
        '$vectorSearch',
        '$rankFusion',
        '$vectorSearch',
      ]);
      expect(pipelines[1]).toEqual(titleOnlyPipeline());
      expect(logger.warn).toHaveBeenCalledOnce();
      expect(vi.mocked(logger.warn).mock.calls[0][0]).toContain("'db-1'");
      expect(vi.mocked(logger.warn).mock.calls[0][0]).toContain('ORFARCHIV_CONTENT_EMBEDDING_EXCLUDED_TARGETS');
    }).pipe(Effect.provide(layer));
  });

  it.effect('runs title-only when the request fails over to an excluded target', () => {
    env.contentEnabled = 'true';
    const { pipelines, layer } = stubServices({
      targets: [CONTENT_TARGET, EXCLUDED_TARGET],
      failingTargets: [CONTENT_TARGET.label],
    });

    return Effect.gen(function* () {
      const news = yield* search();

      expect(news.stories.map((story) => story.id)).toEqual(['news:1']);
      expect(pipelines).toEqual([titleOnlyPipeline()]);
      expect(logger.warn).not.toHaveBeenCalled();
    }).pipe(Effect.provide(layer));
  });

  it.effect('passes other fused query failures through as SearchError', () => {
    env.contentEnabled = 'true';
    const { pipelines, layer } = stubServices({ fusedFailure: new Error('connection reset') });

    return Effect.gen(function* () {
      const error = yield* Effect.flip(search());

      expect(error).toBeInstanceOf(SearchError);
      expect(error.message).toBe('Failed to search news semantically.');
      expect(pipelines).toHaveLength(1);
      expect(logger.warn).not.toHaveBeenCalled();
    }).pipe(Effect.provide(layer));
  });
});
