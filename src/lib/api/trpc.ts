import type { AppRouter } from '$lib/backend/trpc/router';
import { createTRPCClient, httpLink, type TRPCClient } from '@trpc/client';

const trpc: TRPCClient<AppRouter> | null = null;

export function createTRPC(origin?: string): TRPCClient<AppRouter> {
  if (trpc) {
    return trpc;
  }

  return createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${origin ?? ''}/api/trpc`,
      }),
    ],
  });
}
