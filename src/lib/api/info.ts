import { createTRPC } from '#lib/api/trpc.ts';
import type { AppRouter } from '#lib/backend/trpc/router.ts';
import type { TRPCClient } from '@trpc/client';
import { Info } from '#lib/models/info.ts';
import { logger } from '#lib/utils/logger.ts';
import { Result, Schema } from 'effect';

export class InfoApi {
  private readonly trpc: TRPCClient<AppRouter>;
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

    const validationResult = Schema.decodeUnknownResult(Info)(response);
    if (Result.isFailure(validationResult)) {
      throw new Error(`Invalid response from server: ${validationResult.failure.message}`);
    }

    return validationResult.success;
  }
}
