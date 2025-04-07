import { API_VERSION } from '$lib/configs/shared';
import { publicProcedure, router } from './init';

export const appRouter = router({
  info: publicProcedure.query(() => ({
    apiVersion: API_VERSION,
  })),
});

export type AppRouter = typeof appRouter;
