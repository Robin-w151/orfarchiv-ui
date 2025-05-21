import type { AppRouter } from '$lib/backend/trpc/router';
import { DEFAULT_REQUEST_RETRIES, STORY_CONTENT_FETCH_RETRIES } from '$lib/configs/client';
import {
  createTRPCClient,
  httpLink,
  retryLink,
  type Operation,
  type TRPCClient,
  type TRPCClientErrorLike,
} from '@trpc/client';

interface RetryOptions {
  retries: number;
}

const retryableQueries = new Map<string, RetryOptions>([
  ['info', { retries: DEFAULT_REQUEST_RETRIES }],
  ['news.search', { retries: DEFAULT_REQUEST_RETRIES }],
  ['news.checkUpdates', { retries: DEFAULT_REQUEST_RETRIES }],
  ['news.content', { retries: STORY_CONTENT_FETCH_RETRIES }],
]);

let trpc: TRPCClient<AppRouter> | null = null;

export function createTRPC(origin?: string): TRPCClient<AppRouter> {
  if (trpc) {
    return trpc;
  }

  trpc = createTRPCClient<AppRouter>({
    links: [
      retryLink({
        retry: shouldRetry,
        retryDelayMs: calculateRetryDelay,
      }),
      httpLink({
        url: `${origin ?? ''}/api/trpc`,
      }),
    ],
  });

  return trpc;
}

function shouldRetry({
  op,
  error,
  attempts,
}: {
  error: TRPCClientErrorLike<AppRouter>;
  op: Operation;
  attempts: number;
}): boolean {
  if (op.signal?.aborted) {
    return false;
  }

  if (is4xxError(error.data?.httpStatus)) {
    return false;
  }

  const retryOptions = retryableQueries.get(op.path);
  if (!retryOptions) {
    return false;
  }

  if (attempts >= retryOptions.retries) {
    return false;
  }

  return true;
}

function is4xxError(code?: number | undefined): boolean {
  return code !== undefined && code >= 400 && code < 500;
}

function calculateRetryDelay(attempts: number): number {
  const base = 1000 * 2 ** attempts;
  const jitter = Math.random() * 100;
  return base + jitter;
}
