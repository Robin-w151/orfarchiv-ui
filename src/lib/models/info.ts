import { Schema } from 'effect';

export const Info = Schema.Struct({
  apiVersion: Schema.Number,
  semanticSearchEnabled: Schema.optional(Schema.Boolean),
});
export type Info = typeof Info.Type;
