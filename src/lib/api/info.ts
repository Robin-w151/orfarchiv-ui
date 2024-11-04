import { API_INFO } from '$lib/configs/client';
import type { Info } from '$lib/models/info';

let abortController: AbortController | null = null;

export async function fetchInfo(): Promise<Info> {
  console.log('request-api-info');

  abortController?.abort();
  abortController = new AbortController();

  const response = await fetch(API_INFO, { signal: abortController.signal });
  abortController = null;

  if (!response.ok) {
    throw new Error('Failed to fetch api info!');
  }

  return await response.json();
}
