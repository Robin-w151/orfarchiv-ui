import { createTRPC } from '$lib/api/trpc';
import { Info } from '$lib/models/info';
import { logger } from '$lib/utils/logger';

export class InfoApi {
  private trpc = createTRPC();
  private abortController: AbortController | null = null;

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
