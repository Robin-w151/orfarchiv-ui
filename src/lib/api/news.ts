import { News, NewsUpdates } from '$lib/models/news';
import type { PageKey } from '$lib/models/pageKey';
import type { SearchRequestParameters } from '$lib/models/searchRequest';
import { StoryContent } from '$lib/models/story';
import { logger } from '$lib/utils/logger';
import type { TRPCClient } from '@trpc/client';
import { createTRPC } from './trpc';
import type { AppRouter } from '$lib/backend/trpc/router';
import type { ZodSchema } from 'zod';

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

    return this.makeRequest(
      (abortController) => this.trpc.news.search.query(searchRequest, { signal: abortController?.signal }),
      searchNewsRequest,
      News,
    );
  }

  async checkNewsUpdates(searchRequestParameters: SearchRequestParameters, pageKey: PageKey): Promise<NewsUpdates> {
    logger.infoGroup('request-check-news-updates', [
      ['search-request-parameters', searchRequestParameters],
      ['page-key', pageKey],
    ]);

    const searchRequest = { searchRequestParameters, pageKey };

    return this.makeRequest(
      (abortController) => this.trpc.news.checkUpdates.query(searchRequest, { signal: abortController?.signal }),
      checkNewsUpdatesRequest,
      NewsUpdates,
    );
  }

  async fetchContent(url: string, fetchReadMoreContent = false): Promise<StoryContent> {
    logger.infoGroup('request-content', [
      ['url', url],
      ['fetch-read-more-content', fetchReadMoreContent],
    ]);

    return this.makeRequest(() => this.trpc.news.content.query({ url, fetchReadMoreContent }), undefined, StoryContent);
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

  async makeRequest<T>(
    request: (abortController: AbortController | undefined) => Promise<T>,
    requestSymbol: symbol | undefined,
    schema: ZodSchema<T>,
  ): Promise<T> {
    let abortController: AbortController | undefined;

    if (requestSymbol) {
      abortController = this.abortControllers.get(requestSymbol);
      abortController?.abort();
      abortController = new AbortController();
      this.abortControllers.set(requestSymbol, abortController);
    }

    try {
      const response = await request(abortController);

      const validationResult = await schema.safeParseAsync(response);
      if (validationResult.error) {
        throw new Error(`Invalid response from server: ${validationResult.error.message}`);
      }

      return response;
    } catch (error) {
      if (requestSymbol && this.cancels.get(requestSymbol)) {
        this.cancels.delete(requestSymbol);
        throw new Error('Request was cancelled!');
      } else {
        throw error;
      }
    } finally {
      if (requestSymbol) {
        this.abortControllers.delete(requestSymbol);
      }
    }
  }
}
