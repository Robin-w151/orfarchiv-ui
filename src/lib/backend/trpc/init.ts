import { initTRPC } from '@trpc/server';
import type { Context } from './context';

const trpc = initTRPC.context<Context>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;
