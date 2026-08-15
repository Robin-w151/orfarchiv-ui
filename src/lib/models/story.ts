import { Schema } from 'effect';
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

export const StorySummarySimple = Schema.Struct({
  title: Schema.String,
  points: Schema.Array(Schema.String),
  text: Schema.String,
});
export type StorySummarySimple = typeof StorySummarySimple.Type;

export const StorySummaryExtended = Schema.Struct({
  title: Schema.String,
  points: Schema.Array(
    Schema.Struct({
      title: Schema.String,
      text: Schema.String,
    }),
  ),
});
export type StorySummaryExtended = typeof StorySummaryExtended.Type;

export type StorySummary =
  | { readonly type: 'simple'; readonly summary: StorySummarySimple }
  | { readonly type: 'extended'; readonly summary: StorySummaryExtended };
