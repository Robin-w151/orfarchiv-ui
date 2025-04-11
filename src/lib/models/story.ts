import { z } from 'zod';

export const Story = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  url: z.string().url(),
  timestamp: z.string().datetime({ offset: true }),
  source: z.string(),
  isBookmarked: z.number().optional(),
  isViewed: z.number().optional(),
});
export type Story = z.infer<typeof Story>;

export interface StoryEntity {
  _id: unknown;
  id: string;
  title: string;
  category: string;
  url: string;
  timestamp: Date;
  source: string;
}

export const StorySource = z.object({
  name: z.string(),
  url: z.string(),
});
export type StorySource = z.infer<typeof StorySource>;

export const StoryContent = z.object({
  content: z.string(),
  contentText: z.string(),
  id: z.string().optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
  source: StorySource.optional(),
});
export type StoryContent = z.infer<typeof StoryContent>;

export const StoryImage = z.object({
  src: z.string(),
  alt: z.string(),
});
export type StoryImage = z.infer<typeof StoryImage>;

export const SearchStoryOptions = z.object({
  includeOesterreichSource: z.boolean().optional(),
});
export type SearchStoryOptions = z.infer<typeof SearchStoryOptions>;
