import { z } from 'zod';

export const ChartData = z.object({
  title: z.string(),
});
export type ChartData = z.infer<typeof ChartData>;
