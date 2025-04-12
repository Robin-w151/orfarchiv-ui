import { createTRPC } from '$lib/api/trpc';
import type { AppRouter } from '$lib/backend/trpc/router';
import type { TRPCClient } from '@trpc/client';
import { Info } from '$lib/models/info';
import { logger } from '$lib/utils/logger';

export class InfoApi {
  private trpc: TRPCClient<AppRouter>;
  private abortController: AbortController | null = null;

  constructor(origin?: string) {
    this.trpc = createTRPC(origin);
  }

  async fetchInfo(): Promise<Info> {
    logger.info('request-api-info');

    this.abortController?.abort();
    this.abortController = new AbortController();

    const response = await this.trpc.info.query(undefined, { signal: this.abortController.signal });
    this.abortController = null;

    const validationResult = await Info.safeParseAsync(response);
    if (validationResult.error) {
      throw new Error(`Invalid response from server: ${validationResult.error.message}`);
    }

    return response;
  }
}
