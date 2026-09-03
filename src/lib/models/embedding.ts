import { Schema } from 'effect';

export const EmbeddingResponse = Schema.Struct({
  data: Schema.Array(Schema.Struct({ embedding: Schema.Array(Schema.Number) })),
});
