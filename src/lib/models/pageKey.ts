import { Schema } from 'effect';

export const PageKey = Schema.Struct({
  id: Schema.String,
  timestamp: Schema.String,
  type: Schema.Literals(['prev', 'next']),
});
export type PageKey = typeof PageKey.Type;
