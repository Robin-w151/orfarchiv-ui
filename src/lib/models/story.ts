import { z } from 'zod';

export const Story = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  url: z.string().url(),
  timestamp: z.string().datetime({ offset: true }),
  source: z.string(),
  // Flags MUST be of type number to allow querying with IndexedDB
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
  url: z.string().url(),
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

export const StorySummary = z.object({
  title: z.string(),
  points: z.array(
    z.object({
      title: z.string(),
      text: z.string(),
    }),
  ),
  summary: z.string(),
});
export type StorySummary = z.infer<typeof StorySummary>;
