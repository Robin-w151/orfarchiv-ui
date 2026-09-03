import { Schema } from 'effect';
import { PageKey } from './pageKey';
import { Story } from './story';

export const NewsBucket = Schema.Struct({
  name: Schema.String,
  date: Schema.optional(Schema.String),
  stories: Schema.Array(Story),
});
export type NewsBucket = typeof NewsBucket.Type;

export const NewsOrdering = Schema.Literals(['chronological', 'relevance']);
export type NewsOrdering = typeof NewsOrdering.Type;

export const News = Schema.Struct({
  stories: Schema.Array(Story),
  ordering: Schema.optional(NewsOrdering),
  isLoading: Schema.optional(Schema.Boolean),
  storyBuckets: Schema.optional(Schema.Array(NewsBucket)),
  search: Schema.optional(Schema.String),
  prevKey: Schema.optional(Schema.NullOr(PageKey)),
  nextKey: Schema.optional(Schema.NullOr(PageKey)),
});
export type News = typeof News.Type;

export const NewsUpdates = Schema.Struct({
  updateAvailable: Schema.Boolean,
});
export type NewsUpdates = typeof NewsUpdates.Type;
