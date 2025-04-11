import { browser } from '$app/environment';
import { page } from '$app/state';
import type { AppRouter } from '$lib/backend/trpc/router';
import { createTRPCClient, httpLink, type TRPCClient } from '@trpc/client';

export function createTRPC(): TRPCClient<AppRouter> {
  return createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: browser ? '/api/trpc' : `${page.url.origin}/api/trpc`,
      }),
    ],
  });
}
