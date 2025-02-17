import { API_INFO } from '$lib/configs/client';
import type { Info } from '$lib/models/info';
import { logger } from '$lib/utils/logger';

let abortController: AbortController | null = null;

export async function fetchInfo(): Promise<Info> {
  logger.info('request-api-info');

  abortController?.abort();
  abortController = new AbortController();

  const response = await fetch(API_INFO, { signal: abortController.signal });
  abortController = null;

  if (!response.ok) {
    throw new Error('Failed to fetch api info!');
  }

  return await response.json();
}
