import type { AppRouter } from '$lib/backend/trpc/router';
import { createTRPCClient, httpLink, type TRPCClient } from '@trpc/client';

let trpc: TRPCClient<AppRouter> | null = null;

export function createTRPC(origin?: string): TRPCClient<AppRouter> {
  if (trpc) {
    return trpc;
  }

  trpc = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${origin ?? ''}/api/trpc`,
      }),
    ],
  });

  return trpc;
}
