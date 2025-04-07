import { createTRPC } from '$lib/api/trpc';
import type { Info } from '$lib/models/info';
import { logger } from '$lib/utils/logger';

let abortController: AbortController | null = null;

export async function fetchInfo(): Promise<Info> {
  logger.info('request-api-info');

  abortController?.abort();
  abortController = new AbortController();

  const trpc = createTRPC();
  const response = await trpc.info.query(undefined, { signal: abortController.signal });
  abortController = null;

  return response;
}
