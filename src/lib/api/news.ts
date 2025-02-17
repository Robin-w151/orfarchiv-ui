import type { News, NewsUpdates } from '$lib/models/news';
import type { PageKey } from '$lib/models/pageKey';
import type { SearchRequestParameters } from '$lib/models/searchRequest';
import { toSearchParams } from '$lib/utils/searchRequest';
import type { StoryContent } from '$lib/models/story';
import { API_NEWS_CONTENT_URL, API_NEWS_SEARCH_UPDATES_URL, API_NEWS_SEARCH_URL } from '$lib/configs/client';
import { logger } from '$lib/utils/logger';

const abortControllers = new Map<symbol, AbortController>();
const cancels = new Map<symbol, boolean>();
const searchNewsRequest = Symbol('search-news-controller');
const checkNewsUpdatesRequest = Symbol('check-news-updates-controller');

export const cancelSearchNews = cancelRequest.bind(null, searchNewsRequest);
export const cancelCheckNewsUpdates = cancelRequest.bind(null, checkNewsUpdatesRequest);

export async function searchNews(searchRequestParameters: SearchRequestParameters, pageKey?: PageKey): Promise<News> {
  logger.infoGroup('request-search-news', [
    ['search-request-parameters', searchRequestParameters],
    ['page-key', pageKey],
  ]);

  const searchRequest = { searchRequestParameters, pageKey };
  const searchParams = toSearchParams(searchRequest);

  let abortController = abortControllers.get(searchNewsRequest);
  abortController?.abort();
  abortController = new AbortController();
  abortControllers.set(searchNewsRequest, abortController);

  try {
    const response = await fetch(API_NEWS_SEARCH_URL(searchParams), {
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error('Failed to search news!');
    }

    return await response.json();
  } catch (error) {
    if (cancels.get(searchNewsRequest)) {
      cancels.delete(searchNewsRequest);
      throw new Error('Search news request was cancelled!');
    } else {
      throw error;
    }
  } finally {
    abortControllers.delete(searchNewsRequest);
  }
}

export async function checkNewsUpdates(
  searchRequestParameters: SearchRequestParameters,
  pageKey: PageKey,
): Promise<NewsUpdates> {
  logger.infoGroup('request-check-news-updates', [
    ['search-request-parameters', searchRequestParameters],
    ['page-key', pageKey],
  ]);

  const searchRequest = { searchRequestParameters, pageKey };
  const searchParams = toSearchParams(searchRequest);

  let abortController = abortControllers.get(checkNewsUpdatesRequest);
  abortController?.abort();
  abortController = new AbortController();
  abortControllers.set(checkNewsUpdatesRequest, abortController);

  try {
    const response = await fetch(API_NEWS_SEARCH_UPDATES_URL(searchParams), {
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error('Failed to check if news updates are available!');
    }

    return await response.json();
  } catch (error) {
    if (cancels.get(checkNewsUpdatesRequest)) {
      cancels.delete(checkNewsUpdatesRequest);
      throw new Error('Check news updates request was cancelled!');
    } else {
      throw error;
    }
  } finally {
    abortControllers.delete(checkNewsUpdatesRequest);
  }
}

export async function fetchContent(url: string, fetchReadMoreContent = false): Promise<StoryContent> {
  logger.infoGroup('request-content', [
    ['url', url],
    ['fetch-read-more-content', fetchReadMoreContent],
  ]);

  const searchParams = new URLSearchParams();
  searchParams.append('url', url);
  if (fetchReadMoreContent) {
    searchParams.append('fetchReadMoreContent', 'true');
  }
  const response = await fetch(API_NEWS_CONTENT_URL(searchParams.toString()));
  if (!response.ok) {
    throw new Error('Failed to load story content!');
  }
  return response.json();
}

function cancelRequest(controller: symbol): void {
  const abortController = abortControllers.get(controller);

  if (abortController) {
    logger.debug('cancel-request', controller);

    abortController.abort();
    abortControllers.delete(controller);
    cancels.set(controller, true);
  }
}
