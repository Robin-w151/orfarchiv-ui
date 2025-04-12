import { PageKey } from './pageKey';
import { Story } from './story';
import { z } from 'zod';

export const NewsBucket = z.object({
  name: z.string(),
  date: z.string().optional(),
  stories: z.array(Story),
});
export type NewsBucket = z.infer<typeof NewsBucket>;

export const News = z.object({
  stories: z.array(Story),
  isLoading: z.boolean().optional(),
  storyBuckets: z.array(NewsBucket).optional(),
  search: z.string().optional(),
  prevKey: PageKey.optional().nullable(),
  nextKey: PageKey.optional().nullable(),
});
export type News = z.infer<typeof News>;

export const NewsUpdates = z.object({
  updateAvailable: z.boolean(),
});
export type NewsUpdates = z.infer<typeof NewsUpdates>;
