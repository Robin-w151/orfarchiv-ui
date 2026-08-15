import { Schema } from 'effect';

export const Info = Schema.Struct({
  apiVersion: Schema.Number,
});
export type Info = typeof Info.Type;
