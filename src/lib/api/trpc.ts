import { createTRPCClient, httpBatchLink, type TRPCClient } from '@trpc/client';
import { browser } from '$app/environment';
import { page } from '$app/state';
import type { AppRouter } from '$lib/backend/trpc/router';

export function createTRPC(): TRPCClient<AppRouter> {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: browser ? '/api/trpc' : `${page.url.origin}/api/trpc`,
      }),
    ],
  });
}
