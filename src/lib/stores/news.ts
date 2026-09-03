import type { Bookmarks } from '$lib/models/bookmarks';
import type { News, NewsBucket, NewsOrdering } from '$lib/models/news';
import type { Story, StoryContent } from '$lib/models/story';
import { DateTime } from 'luxon';
import { derived, get, writable, type Readable } from 'svelte/store';
import bookmarks from './bookmarks';
import settings from './settings';
import { NEWS_QUERY_PAGE_LIMIT } from '$lib/configs/shared';
import { logger } from '$lib/utils/logger';
import type { Request } from '$lib/models/request';

export interface NewsStore extends Readable<News>, Partial<News> {
  setNews: (news: News, newNews?: News) => void;
  addNews: (news: News, append?: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  taskWithLoading: (handler: () => void | Promise<void>) => Promise<void>;
  cacheForOfflineUse: (
    fetchContent: (url: string, fetchReadMoreContent: boolean) => Request<StoryContent>,
  ) => Promise<void>;
}

const initialState = { stories: [], isLoading: true };
const news = writable<News>(initialState);
const { update } = news;

function setNews(news: News, newNews?: News): void {
  if (!news && !newNews) {
    return;
  }

  const { stories, prevKey, nextKey, ordering } = news;
  const { stories: newStories = [], prevKey: newPrevKey } = newNews ?? {};
  const combinedStories = newStories.concat(stories);
  const deduplicatedStories = deduplicateStories(combinedStories);

  update((oldNews) => {
    return { ...oldNews, stories: deduplicatedStories, prevKey: newPrevKey ?? prevKey, nextKey, ordering };
  });
}

function addNews(news: News, append = true): void {
  if (!news) {
    return;
  }
  const { stories, prevKey, nextKey, ordering } = news;

  update((oldNews) => {
    const newStories = append ? oldNews.stories.concat(stories) : stories.concat(oldNews.stories);
    const newNews = { ...oldNews, stories: deduplicateStories(newStories), ordering };

    if (append) {
      return { ...newNews, nextKey };
    } else if (prevKey) {
      return { ...newNews, prevKey };
    }
    return newNews;
  });
}

function setIsLoading(isLoading: boolean): void {
  update((oldNews) => ({ ...oldNews, isLoading }));
}

async function taskWithLoading(handler: () => void | Promise<void>): Promise<void> {
  try {
    setIsLoading(true);
    await handler();
    setIsLoading(false);
  } catch (error) {
    const { name } = error as Error;
    if (name === 'AbortError') {
      return;
    }
    setIsLoading(false);
    logger.warn(error);
  }
}

async function cacheForOfflineUse(
  fetchContent: (url: string, fetchReadMoreContent: boolean) => Request<StoryContent>,
): Promise<void> {
  const fetchReadMoreContentPreference = get(settings).fetchReadMoreContent;
  const stories = get(news).stories.slice(0, 100);
  await Promise.allSettled(
    stories.map((story) => {
      const fetchReadMoreContent = fetchReadMoreContentPreference && story.source === 'news';
      return fetchContent(story.url, fetchReadMoreContent).request;
    }),
  );
}

function createStoryBuckets(
  stories: ReadonlyArray<Story>,
  ordering?: NewsOrdering,
): ReadonlyArray<NewsBucket> | undefined {
  if (!stories) {
    return undefined;
  }

  if (ordering === 'relevance') {
    return [{ name: formatResultCount(stories.length), date: undefined, stories: [...stories] }];
  }

  type StoryBucket = { name: string; date: string; stories: Array<Story> };

  const buckets: Map<string, StoryBucket> = new Map();
  function addToBucket(buckets: Map<string, StoryBucket>, story: Story): void {
    const timestamp = DateTime.fromISO(story.timestamp);
    const date = timestamp.toISODate() ?? '1970-01-01T00:00:00Z';
    if (buckets.has(date)) {
      buckets.get(date)?.stories.push(story);
    } else {
      const name = timestamp.setLocale('de-AT').toFormat('cccc, dd.MM.yyyy');
      const bucket = {
        name,
        date,
        stories: [story],
      };
      buckets.set(date, bucket);
    }
  }

  function compareBuckets(b1: NewsBucket, b2: NewsBucket): number {
    if (!b1.date || !b2.date) {
      return 0;
    }

    return b2.date.localeCompare(b1.date);
  }

  for (const story of stories) {
    addToBucket(buckets, story);
  }
  return Array.from(buckets.values()).sort(compareBuckets);
}

function formatResultCount(count: number): string {
  if (count === 1) {
    return '1 Ergebnis';
  }

  return count >= NEWS_QUERY_PAGE_LIMIT ? `${count}+ Ergebnisse` : `${count} Ergebnisse`;
}

function setBookmarkStatus(stories: ReadonlyArray<Story>, bookmarkStories: ReadonlyArray<Story>): ReadonlyArray<Story> {
  const bookmarkIds = new Set(bookmarkStories.map((b) => b.id));
  return stories.map((story) => ({ ...story, isBookmarked: +bookmarkIds.has(story.id) }));
}

function deduplicateStories(stories: ReadonlyArray<Story>): ReadonlyArray<Story> {
  const storyIds = new Set<string>();
  return stories.filter((story) => {
    if (storyIds.has(story.id)) {
      logger.warnGroup('news-store', [['duplicate-story-id', story.id]]);
      return false;
    }

    storyIds.add(story.id);
    return true;
  });
}

let oldStories: ReadonlyArray<Story>;
let oldBookmarkStories: ReadonlyArray<Story>;
let oldOrdering: NewsOrdering | undefined;
let cachedStories: ReadonlyArray<Story>;
let cachedStoryBuckets: ReadonlyArray<NewsBucket> | undefined;

function combineNewsAndBookmarks([news, bookmarks]: [News, Bookmarks]): News {
  const stories = news.stories;
  const bookmarkStories = bookmarks.stories;

  let newStories = cachedStories;
  let newStoryBuckets = cachedStoryBuckets;

  if (oldStories !== stories || oldBookmarkStories !== bookmarkStories || oldOrdering !== news.ordering) {
    oldStories = stories;
    oldBookmarkStories = bookmarkStories;
    oldOrdering = news.ordering;

    newStories = setBookmarkStatus(stories, bookmarkStories);
    newStoryBuckets = createStoryBuckets(newStories, news.ordering);

    cachedStories = newStories;
    cachedStoryBuckets = newStoryBuckets;
  }

  return { ...news, stories: newStories, storyBuckets: newStoryBuckets };
}

const extendedStore = derived([news, bookmarks], combineNewsAndBookmarks);
const { subscribe } = extendedStore;

export default {
  subscribe,
  setNews,
  addNews,
  setIsLoading,
  taskWithLoading,
  cacheForOfflineUse,
} as NewsStore;
