import { News, NewsUpdates } from '$lib/models/news';
import type { PageKey } from '$lib/models/pageKey';
import type { SearchRequestParameters } from '$lib/models/searchRequest';
import { StoryContent } from '$lib/models/story';
import { logger } from '$lib/utils/logger';
import type { TRPCClient } from '@trpc/client';
import { createTRPC } from './trpc';
import type { AppRouter } from '$lib/backend/trpc/router';

const searchNewsRequest = Symbol('search-news-controller');
const checkNewsUpdatesRequest = Symbol('check-news-updates-controller');

export class NewsApi {
  private trpc: TRPCClient<AppRouter>;
  private abortControllers = new Map<symbol, AbortController>();
  private cancels = new Map<symbol, boolean>();

  constructor(origin?: string) {
    this.trpc = createTRPC(origin);
  }

  async searchNews(searchRequestParameters: SearchRequestParameters, pageKey?: PageKey): Promise<News> {
    logger.infoGroup('request-search-news', [
      ['search-request-parameters', searchRequestParameters],
      ['page-key', pageKey],
    ]);

    const searchRequest = { searchRequestParameters, pageKey };

    let abortController = this.abortControllers.get(searchNewsRequest);
    abortController?.abort();
    abortController = new AbortController();
    this.abortControllers.set(searchNewsRequest, abortController);

    try {
      const response = await this.trpc.news.search.query(searchRequest, {
        signal: abortController.signal,
      });

      const validationResult = await News.safeParseAsync(response);
      if (validationResult.error) {
        throw new Error(`Invalid response from server: ${validationResult.error.message}`);
      }

      return response;
    } catch (error) {
      if (this.cancels.get(searchNewsRequest)) {
        this.cancels.delete(searchNewsRequest);
        throw new Error('Search news request was cancelled!');
      } else {
        throw error;
      }
    } finally {
      this.abortControllers.delete(searchNewsRequest);
    }
  }

  async checkNewsUpdates(searchRequestParameters: SearchRequestParameters, pageKey: PageKey): Promise<NewsUpdates> {
    logger.infoGroup('request-check-news-updates', [
      ['search-request-parameters', searchRequestParameters],
      ['page-key', pageKey],
    ]);

    const searchRequest = { searchRequestParameters, pageKey };

    let abortController = this.abortControllers.get(checkNewsUpdatesRequest);
    abortController?.abort();
    abortController = new AbortController();
    this.abortControllers.set(checkNewsUpdatesRequest, abortController);

    try {
      const response = await this.trpc.news.checkUpdates.query(searchRequest, {
        signal: abortController.signal,
      });

      const validationResult = await NewsUpdates.safeParseAsync(response);
      if (validationResult.error) {
        throw new Error(`Invalid response from server: ${validationResult.error.message}`);
      }

      return response;
    } catch (error) {
      if (this.cancels.get(checkNewsUpdatesRequest)) {
        this.cancels.delete(checkNewsUpdatesRequest);
        throw new Error('Check news updates request was cancelled!');
      } else {
        throw error;
      }
    } finally {
      this.abortControllers.delete(checkNewsUpdatesRequest);
    }
  }

  async fetchContent(url: string, fetchReadMoreContent = false): Promise<StoryContent> {
    logger.infoGroup('request-content', [
      ['url', url],
      ['fetch-read-more-content', fetchReadMoreContent],
    ]);

    const response = await this.trpc.news.content.query({ url, fetchReadMoreContent });

    const validationResult = await StoryContent.safeParseAsync(response);
    if (validationResult.error) {
      throw new Error(`Invalid response from server: ${validationResult.error.message}`);
    }

    return response;
  }

  cancelSearchNews(): void {
    this.cancelRequest(searchNewsRequest);
  }

  cancelCheckNewsUpdates(): void {
    this.cancelRequest(checkNewsUpdatesRequest);
  }

  private cancelRequest(controllerSymbol: symbol): void {
    const abortController = this.abortControllers.get(controllerSymbol);

    if (abortController) {
      logger.debug('cancel-request', controllerSymbol);

      abortController.abort();
      this.abortControllers.delete(controllerSymbol);
      this.cancels.set(controllerSymbol, true);
    }
  }
}
