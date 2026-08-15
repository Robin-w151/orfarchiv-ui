import { Schema } from 'effect';

export const ChartData = Schema.Struct({
  title: Schema.String,
});
export type ChartData = typeof ChartData.Type;
