import type { AppRouter } from '$lib/backend/trpc/router';
import { News, NewsUpdates } from '$lib/models/news';
import type { PageKey } from '$lib/models/pageKey';
import type { Request } from '$lib/models/request';
import type { SearchRequestParameters } from '$lib/models/searchRequest';
import { StoryContent } from '$lib/models/story';
import { logger } from '$lib/utils/logger';
import type { TRPCClient } from '@trpc/client';
import { v4 as uuid } from 'uuid';
import type { ZodType } from 'zod';
import { createTRPC } from './trpc';

const searchNewsRequest = 'search-news-controller';
const checkNewsUpdatesRequest = 'check-news-updates-controller';

type RequestId = string;
type RequestController<I extends RequestId | undefined> = I extends string ? AbortController : undefined;

export class NewsApi {
  private trpc: TRPCClient<AppRouter>;
  private abortControllers = new Map<RequestId, AbortController>();
  private cancels = new Map<RequestId, boolean>();

  constructor(origin?: string) {
    this.trpc = createTRPC(origin);
  }

  searchNews(searchRequestParameters: SearchRequestParameters, pageKey?: PageKey): Promise<News> {
    logger.infoGroup('request-search-news', [
      ['search-request-parameters', searchRequestParameters],
      ['page-key', pageKey],
    ]);

    const searchRequest = { searchRequestParameters, pageKey };

    return this.makeRequest(
      (abortController) => this.trpc.news.search.query(searchRequest, { signal: abortController.signal }),
      searchNewsRequest,
      News,
    );
  }

  checkNewsUpdates(searchRequestParameters: SearchRequestParameters, pageKey: PageKey): Promise<NewsUpdates> {
    logger.infoGroup('request-check-news-updates', [
      ['search-request-parameters', searchRequestParameters],
      ['page-key', pageKey],
    ]);

    const searchRequest = { searchRequestParameters, pageKey };

    return this.makeRequest(
      (abortController) => this.trpc.news.checkUpdates.query(searchRequest, { signal: abortController.signal }),
      checkNewsUpdatesRequest,
      NewsUpdates,
    );
  }

  fetchContent(url: string, fetchReadMoreContent = false): Request<StoryContent> {
    logger.infoGroup('request-content', [
      ['url', url],
      ['fetch-read-more-content', fetchReadMoreContent],
    ]);

    const requestId = uuid();
    const request = this.makeRequest(
      (abortController) =>
        this.trpc.news.content.query({ url, fetchReadMoreContent }, { signal: abortController.signal }),
      requestId,
      StoryContent,
    );

    return { request, cancel: () => this.cancelRequest(requestId) };
  }

  cancelSearchNews(): void {
    this.cancelRequest(searchNewsRequest);
  }

  cancelCheckNewsUpdates(): void {
    this.cancelRequest(checkNewsUpdatesRequest);
  }

  private cancelRequest(requestId: RequestId): void {
    const abortController = this.abortControllers.get(requestId);

    if (abortController) {
      logger.debug('cancel-request', requestId);

      abortController.abort();
      this.abortControllers.delete(requestId);
      this.cancels.set(requestId, true);
    }
  }

  private async makeRequest<T, I extends RequestId | undefined>(
    request: (abortController: RequestController<I>) => Promise<T>,
    requestId: I,
    schema: ZodType<T>,
  ): Promise<T> {
    let abortController: AbortController | undefined;

    if (typeof requestId === 'string') {
      abortController = this.abortControllers.get(requestId);
      abortController?.abort();
      abortController = new AbortController();
      this.abortControllers.set(requestId, abortController);
    }

    try {
      const response = await request(abortController as RequestController<I>);

      const validationResult = await schema.safeParseAsync(response);
      if (validationResult.error) {
        throw new Error(`Invalid response from server: ${validationResult.error.message}`);
      }

      return response;
    } catch (error) {
      if (requestId && this.cancels.get(requestId)) {
        this.cancels.delete(requestId);
        throw new Error('Request was cancelled!');
      } else {
        throw error;
      }
    } finally {
      if (requestId) {
        this.abortControllers.delete(requestId);
      }
    }
  }
}
