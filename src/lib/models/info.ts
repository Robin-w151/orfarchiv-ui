import { z } from 'zod';

export const Info = z.object({
  apiVersion: z.number(),
});
export type Info = z.infer<typeof Info>;
