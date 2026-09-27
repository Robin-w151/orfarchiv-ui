import { DatabaseService, type DatabaseServiceShape } from '$lib/backend/db/database';
import { NEWS_QUERY_PAGE_LIMIT } from '$lib/configs/shared';
import { SearchError } from '$lib/errors/errors';
import type { StoryEntity } from '$lib/models/story';
import { it } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import type { Collection } from 'mongodb';
import { describe, expect } from 'vitest';
import { KeywordSearchService } from './keyword';

interface ExecutedQuery {
  filter: unknown;
  limit?: number;
  sort?: unknown;
}

function makeStories(count: number): Array<StoryEntity> {
  return Array.from({ length: count }, (_, index) => ({
    _id: index,
    id: `news:${count - index}`,
    title: `Story ${count - index}`,
    category: 'Chronik',
    url: `https://orf.at/stories/${count - index}/`,
    timestamp: new Date(Date.UTC(2026, 0, 1, 0, count - index)),
    source: 'news',
  }));
}

function stubDatabase(stories: Array<StoryEntity> | Error) {
  const executed: Array<ExecutedQuery> = [];
  const collection = {
    find: (filter: unknown) => {
      const query: ExecutedQuery = { filter };
      executed.push(query);
      const cursor = {
        limit: (limit: number) => ((query.limit = limit), cursor),
        sort: (sort: unknown) => ((query.sort = sort), cursor),
        toArray: async () => {
          if (stories instanceof Error) {
            throw stories;
          }
          return stories;
        },
      };
      return cursor;
    },
  } as unknown as Collection<Document>;

  const database: DatabaseServiceShape = {
    useNewsCollection: (message, use) =>
      Effect.tryPromise({ try: () => use(collection), catch: (cause) => new SearchError({ message, cause }) }),
    health: Effect.succeed([]),
  };

  const layer = KeywordSearchService.layer.pipe(Layer.provide(Layer.succeed(DatabaseService, database)));
  return { executed, layer };
}

describe('KeywordSearchService', () => {
  it.effect('returns the first page with a next key when more stories exist', () => {
    const { executed, layer } = stubDatabase(makeStories(NEWS_QUERY_PAGE_LIMIT + 1));

    return Effect.gen(function* () {
      const keywordSearchService = yield* KeywordSearchService;
      const news = yield* keywordSearchService.searchNews({ searchRequestParameters: { textFilter: 'wien' } });

      expect(news.stories).toHaveLength(NEWS_QUERY_PAGE_LIMIT);
      expect(news.prevKey?.id).toBe(`news:${NEWS_QUERY_PAGE_LIMIT + 1}`);
      expect(news.nextKey).toEqual({ id: 'news:2', timestamp: news.stories.at(-1)!.timestamp, type: 'next' });
      expect(executed).toHaveLength(1);
      expect(executed[0].limit).toBe(NEWS_QUERY_PAGE_LIMIT + 1);
      expect(executed[0].sort).toEqual({ timestamp: -1, id: -1 });
    }).pipe(Effect.provide(layer));
  });

  it.effect('returns no next key on the last page', () => {
    const { layer } = stubDatabase(makeStories(3));

    return Effect.gen(function* () {
      const keywordSearchService = yield* KeywordSearchService;
      const news = yield* keywordSearchService.searchNews({ searchRequestParameters: {} });

      expect(news.stories.map((story) => story.id)).toEqual(['news:3', 'news:2', 'news:1']);
      expect(news.nextKey).toBeNull();
    }).pipe(Effect.provide(layer));
  });

  it.effect('passes a database failure through as SearchError', () => {
    const { layer } = stubDatabase(new Error('all targets down'));

    return Effect.gen(function* () {
      const keywordSearchService = yield* KeywordSearchService;
      const error = yield* Effect.flip(keywordSearchService.searchNews({ searchRequestParameters: {} }));

      expect(error).toBeInstanceOf(SearchError);
      expect(error.message).toBe('Failed to search news.');
    }).pipe(Effect.provide(layer));
  });
});
