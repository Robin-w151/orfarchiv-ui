import { Schema } from 'effect';
import { isOrfUrl, isUrl } from './checks';

export const StoryContentRequest = Schema.Struct({
  url: Schema.String.check(isUrl, isOrfUrl),
  fetchReadMoreContent: Schema.optional(Schema.Boolean),
});
