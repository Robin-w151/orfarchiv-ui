import orfArchivDb from '$lib/backend/db/init';
import { logger, NEWS_QUERY_PAGE_LIMIT } from '$lib/configs/server';
import type { News, NewsUpdates } from '$lib/models/news';
import type { PageKey } from '$lib/models/pageKey';
import type { SearchRequest, SearchRequestParameters } from '$lib/models/searchRequest';
import type { SearchStoryOptions, Story, StoryEntity } from '$lib/models/story';
import type { Collection, Sort } from 'mongodb';

type PageKeyFn = (stories: Array<StoryEntity>) => PageKey | null;

interface PaginatedQuery {
  paginatedQuery: any;
  sort: Sort;
  prevKeyFn: PageKeyFn;
  nextKeyFn: PageKeyFn;
}

export async function searchNews(searchRequest: SearchRequest): Promise<News> {
  logger.info(`Search news with request='${JSON.stringify(searchRequest)}'`);

  const { searchRequestParameters, pageKey } = searchRequest;

  const query = buildQuery(searchRequestParameters);
  const { paginatedQuery, sort, prevKeyFn, nextKeyFn } = generatePaginationQuery(query, pageKey);
  const limit = pageKey?.type === 'prev' ? 0 : NEWS_QUERY_PAGE_LIMIT + 1;

  const newsCollection = orfArchivDb.newsCollection();
  const stories = await executeQuery(newsCollection, paginatedQuery, sort, limit);
  const orderedStories = correctOrder(stories, pageKey);
  const { prevKey, nextKey } = getPageKeys(stories, prevKeyFn, nextKeyFn, pageKey);

  return {
    stories: orderedStories
      .filter((story, index): story is StoryEntity => index < NEWS_QUERY_PAGE_LIMIT && isStoryEntity(story))
      .map((story) => mapToStory(story)),
    prevKey,
    nextKey,
  };
}

export async function checkNewsUpdatesAvailable(searchRequest: SearchRequest): Promise<NewsUpdates> {
  logger.info(`Check if news updates with request='${JSON.stringify(searchRequest)}' are available`);

  if (searchRequest.pageKey?.type !== 'prev') {
    return { updateAvailable: false };
  }

  const news = await searchNews(searchRequest);
  return { updateAvailable: news.stories.length > 0 };
}

export async function searchStory(url: string, options?: SearchStoryOptions): Promise<Story | undefined> {
  logger.info(`Search story with url='${url}'`);

  const { includeOesterreichSource = false } = options ?? {};
  const query: { url: string; source?: unknown } = { url, source: { $ne: 'oesterreich' } };
  if (includeOesterreichSource) {
    delete query.source;
  }

  const newsCollection = orfArchivDb.newsCollection();
  const story = await newsCollection.findOne(query);
  if (isStoryEntity(story)) {
    return mapToStory(story);
  } else {
    return undefined;
  }
}

function buildQuery({ textFilter, dateFilter, sources }: SearchRequestParameters) {
  const textFilters = textFilter
    ?.split(/\s+/)
    .filter((text) => !!text)
    .map((text) => text.toLowerCase())
    .map((text) => new RegExp(`${text}`, 'i'));

  const textQuery =
    textFilters && textFilters.length > 0
      ? {
          $and: textFilters?.map((filter) => ({
            $or: ['title', 'category', 'source'].map((key) => ({ [key]: { $in: [filter] } })),
          })),
        }
      : {};

  const fromDate = dateFilter?.from?.toJSDate();
  const fromQuery = fromDate ? { timestamp: { $gte: fromDate } } : {};

  const toDate = dateFilter?.to?.toJSDate();
  const toQuery = toDate ? { timestamp: { $lte: toDate } } : {};

  const sourceQuery = sources?.length && sources.length > 0 ? { source: { $in: sources } } : {};
  return { $and: [textQuery, fromQuery, toQuery, sourceQuery] };
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

    const story = stories[stories.length - 2];
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
  return pageKey?.type === 'prev' ? stories.reverse() : stories;
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

function mapToStory(entry: StoryEntity): Story {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    url: entry.url,
    timestamp: entry.timestamp.toISOString(),
    source: entry.source,
  };
}

function isStoryEntity(story: unknown): story is StoryEntity {
  return (
    !!story &&
    typeof story === 'object' &&
    '_id' in story &&
    !!story._id &&
    'id' in story &&
    !!story.id &&
    'title' in story &&
    !!story.title &&
    'category' in story &&
    !!story.category &&
    'url' in story &&
    !!story.url &&
    'timestamp' in story &&
    !!story.timestamp &&
    typeof story.timestamp === 'object' &&
    'source' in story &&
    !!story.source
  );
}
