import { z } from 'zod';

export const PageKey = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(['prev', 'next']),
});
export type PageKey = z.infer<typeof PageKey>;
