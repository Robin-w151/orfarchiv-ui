import { NEWS_QUERY_PAGE_LIMIT } from '$lib/configs/shared';
import type { SearchError } from '$lib/errors/errors';
import type { News } from '$lib/models/news';
import type { PageKey } from '$lib/models/pageKey';
import type { KeywordSearchRequest, KeywordSearchRequestParameters, SearchMatchMode } from '$lib/models/searchRequest';
import type { StoryEntity } from '$lib/models/story';
import { Context, Effect, Layer } from 'effect';
import type { Collection, Sort } from 'mongodb';
import { isStoryEntity, mapToStory, parseDate, useNewsCollection } from './shared';

type PageKeyFn = (stories: Array<StoryEntity>) => PageKey | null;

interface PaginatedQuery {
  paginatedQuery: any;
  sort: Sort;
  prevKeyFn: PageKeyFn;
  nextKeyFn: PageKeyFn;
}

export type KeywordSearchServiceShape = Context.Service.Shape<typeof KeywordSearchService>;
export class KeywordSearchService extends Context.Service<KeywordSearchService>()('search/KeywordSearchService', {
  make: Effect.succeed(defineService()),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function defineService() {
  function searchNews(searchRequest: KeywordSearchRequest): Effect.Effect<News, SearchError> {
    return Effect.gen(function* () {
      const { searchRequestParameters, pageKey } = searchRequest;

      const query = buildQuery(searchRequestParameters);
      const { paginatedQuery, sort, prevKeyFn, nextKeyFn } = generatePaginationQuery(query, pageKey);
      const limit = pageKey?.type === 'prev' ? 0 : NEWS_QUERY_PAGE_LIMIT + 1;

      const stories = yield* useNewsCollection('Failed to search news.', (newsCollection) =>
        executeQuery(newsCollection, paginatedQuery, sort, limit),
      );
      const orderedStories = correctOrder(stories, pageKey);
      const { prevKey, nextKey } = getPageKeys(orderedStories, prevKeyFn, nextKeyFn, pageKey);

      return {
        stories: orderedStories
          .filter((story, index): story is StoryEntity => index < NEWS_QUERY_PAGE_LIMIT && isStoryEntity(story))
          .map((story) => mapToStory(story)),
        prevKey,
        nextKey,
      };
    });
  }

  return { searchNews } as const;
}

function buildQuery({ tag, textFilter, dateFilter, sources, matchMode }: KeywordSearchRequestParameters) {
  const textFilters = textFilter
    ?.split(/\s+/)
    .filter((text) => !!text)
    .map((text) => text.toLowerCase())
    .map((text) => new RegExp(`${text}`, 'i'));

  const tagQuery = buildTagQuery(tag);
  const textQuery = buildTextQuery(textFilters, matchMode);

  const fromDate = parseDate(dateFilter?.from);
  const fromQuery = fromDate ? { timestamp: { $gte: fromDate } } : {};

  const toDate = parseDate(dateFilter?.to);
  const toQuery = toDate ? { timestamp: { $lte: toDate } } : {};

  const sourceQuery = sources?.length && sources.length > 0 ? { source: { $in: sources } } : {};
  return { $and: [tagQuery, textQuery, fromQuery, toQuery, sourceQuery] };
}

function buildTagQuery(tag: string | undefined) {
  if (!tag) {
    return {};
  }

  const tagRegex = new RegExp(tag, 'i');
  return {
    $or: ['category', 'source'].map((key) => ({ [key]: { $in: [tagRegex] } })),
  };
}

function buildTextQuery(textFilters: Array<RegExp> | undefined, matchMode: SearchMatchMode = 'anyOf') {
  if (!textFilters || textFilters.length === 0) {
    return {};
  }

  const textFilterQueries = textFilters?.map((filter) => ({
    $or: ['title', 'category', 'source'].map((key) => ({ [key]: { $in: [filter] } })),
  }));

  switch (matchMode) {
    case 'anyOf':
      return { $or: textFilterQueries };
    case 'allOf':
      return { $and: textFilterQueries };
  }
}

function generatePaginationQuery(query: any, pageKey?: PageKey): PaginatedQuery {
  const next = !pageKey || pageKey?.type === 'next';
  const sort: Sort = next ? { timestamp: -1, id: -1 } : { timestamp: 1, id: 1 };

  function prevKeyFn(stories: Array<StoryEntity>): PageKey | null {
    if (stories.length === 0) {
      return null;
    }

    const story = stories[0];
    return { id: story.id, timestamp: story.timestamp.toISOString(), type: 'prev' };
  }

  function nextKeyFn(stories: Array<StoryEntity>): PageKey | null {
    if (stories.length < NEWS_QUERY_PAGE_LIMIT + 1) {
      return null;
    }

    const story = stories.at(-2);
    if (!story) {
      return null;
    }

    return { id: story.id, timestamp: story.timestamp.toISOString(), type: 'next' };
  }

  if (!pageKey) {
    return { paginatedQuery: query, sort, prevKeyFn, nextKeyFn };
  }

  let paginatedQuery = query;

  const sortField = 'timestamp';
  const sortFieldValue = new Date(pageKey[sortField]);
  const sortOperator = next ? '$lt' : '$gt';

  const paginationQuery = [
    { [sortField]: { [sortOperator]: sortFieldValue } },
    {
      $and: [{ [sortField]: sortFieldValue }, { id: { [sortOperator]: pageKey.id } }],
    },
  ];

  if (paginatedQuery.$or == null) {
    paginatedQuery.$or = paginationQuery;
  } else {
    paginatedQuery = { $and: [query, { $or: paginationQuery }] };
  }

  return { paginatedQuery, sort, prevKeyFn, nextKeyFn };
}

function executeQuery(
  newsCollection: Collection<Document>,
  query: any,
  sort: Sort,
  limit: number,
): Promise<Array<StoryEntity>> {
  return newsCollection.find(query).limit(limit).sort(sort).toArray() as unknown as Promise<Array<StoryEntity>>;
}

function correctOrder<T>(stories: Array<T>, pageKey?: PageKey): Array<T> {
  return pageKey?.type === 'prev' ? stories.toReversed() : stories;
}

function getPageKeys(
  stories: Array<StoryEntity>,
  prevKeyFn: PageKeyFn,
  nextKeyFn: PageKeyFn,
  pageKey?: PageKey,
): { prevKey?: PageKey | null; nextKey?: PageKey | null } {
  const prevKey = !pageKey || pageKey?.type === 'prev' ? prevKeyFn(stories) : undefined;
  const nextKey = !pageKey || pageKey?.type === 'next' ? nextKeyFn(stories) : undefined;
  return { prevKey, nextKey };
}
