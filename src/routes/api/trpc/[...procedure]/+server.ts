import type { RequestHandler } from '@sveltejs/kit';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '$lib/backend/trpc/router';

export const GET: RequestHandler = (event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => ({}),
  });
};

export const POST = GET;
