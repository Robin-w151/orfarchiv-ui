import { z } from 'zod';

export const Story = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string().optional(),
  url: z.url(),
  timestamp: z.iso.datetime({ offset: true }),
  source: z.string(),
  // Flags MUST be of type number to allow querying with IndexedDB
  isBookmarked: z.number().optional(),
  isViewed: z.number().optional(),
});
export type Story = z.infer<typeof Story>;

export const StoryEntity = z.object({
  _id: z.unknown(),
  id: z.string(),
  title: z.string(),
  category: z.string().nullish(),
  url: z.url(),
  timestamp: z.date(),
  source: z.string(),
});
export type StoryEntity = z.infer<typeof StoryEntity>;

export const StorySource = z.object({
  name: z.string(),
  url: z.url(),
});
export type StorySource = z.infer<typeof StorySource>;

export const StoryContent = z.object({
  content: z.string(),
  contentText: z.string(),
  id: z.string().optional(),
  timestamp: z.iso.datetime({ offset: true }).optional(),
  source: StorySource.optional(),
});
export type StoryContent = z.infer<typeof StoryContent>;

export const StoryImage = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});
export type StoryImage = z.infer<typeof StoryImage>;

export const SearchStoryOptions = z.object({
  includeOesterreichSource: z.boolean().optional(),
});
export type SearchStoryOptions = z.infer<typeof SearchStoryOptions>;

export const StorySummarySimple = z.object({
  title: z.string(),
  points: z.array(z.string()),
  text: z.string(),
});
export type StorySummarySimple = z.infer<typeof StorySummarySimple>;

export const StorySummaryExtended = z.object({
  title: z.string(),
  points: z.array(
    z.object({
      title: z.string(),
      text: z.string(),
    }),
  ),
});
export type StorySummaryExtended = z.infer<typeof StorySummaryExtended>;

export const StorySummary = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('simple'),
    summary: StorySummarySimple,
  }),
  z.object({
    type: z.literal('extended'),
    summary: StorySummaryExtended,
  }),
]);
export type StorySummary = z.infer<typeof StorySummary>;
