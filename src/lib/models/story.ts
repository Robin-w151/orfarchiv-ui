import { isIsoDateTime, isUrl } from '$lib/models/checks';
import { Schema } from 'effect';

export const Story = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  category: Schema.optional(Schema.String),
  url: Schema.String.check(isUrl),
  timestamp: Schema.String.check(isIsoDateTime),
  source: Schema.String,
  // Flags MUST be of type number to allow querying with IndexedDB
  isBookmarked: Schema.optional(Schema.Number),
  isViewed: Schema.optional(Schema.Number),
});
export type Story = typeof Story.Type;

export const StoryEntity = Schema.Struct({
  _id: Schema.Unknown,
  id: Schema.String,
  title: Schema.String,
  category: Schema.optional(Schema.NullOr(Schema.String)),
  url: Schema.String.check(isUrl),
  timestamp: Schema.Date,
  source: Schema.String,
});
export type StoryEntity = typeof StoryEntity.Type;

export const StorySource = Schema.Struct({
  name: Schema.String,
  url: Schema.String.check(isUrl),
});
export type StorySource = typeof StorySource.Type;

export const StoryContentChapter = Schema.Struct({
  title: Schema.optional(Schema.String),
  segments: Schema.Array(Schema.String),
});
export type StoryContentChapter = typeof StoryContentChapter.Type;

export const StoryContent = Schema.Struct({
  contentHtml: Schema.String,
  contentChapters: Schema.Array(StoryContentChapter),
  id: Schema.optional(Schema.String),
  timestamp: Schema.optional(Schema.String.check(isIsoDateTime)),
  source: Schema.optional(StorySource),
});
export type StoryContent = typeof StoryContent.Type;

export const StoryImage = Schema.Struct({
  src: Schema.String,
  alt: Schema.String,
  caption: Schema.optional(Schema.String),
});
export type StoryImage = typeof StoryImage.Type;

export const SearchStoryOptions = Schema.Struct({
  includeOesterreichSource: Schema.optional(Schema.Boolean),
});
export type SearchStoryOptions = typeof SearchStoryOptions.Type;

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
