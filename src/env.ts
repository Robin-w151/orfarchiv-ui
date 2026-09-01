import { isUrl } from '$lib/models/checks';
import { defineEnvVars } from '@sveltejs/kit/env';
import { Schema } from 'effect';

export const variables = defineEnvVars({
  ORFARCHIV_DB_URL: {
    description: 'URL of the ORF Archiv database',
    schema: Schema.toStandardSchemaV1(Schema.String.check(isUrl)),
  },
  ORFARCHIV_EMBEDDING_URL: {
    description: 'OpenAI-compatible base URL of the embedding server ("/embeddings" is appended)',
    schema: Schema.toStandardSchemaV1(Schema.optional(Schema.String.check(isUrl))),
  },
  ORFARCHIV_EMBEDDING_TOKEN: {
    description: 'Bearer token for the embedding server. Mandatory once the endpoint is public',
    schema: Schema.toStandardSchemaV1(Schema.optional(Schema.String)),
  },
  ORFARCHIV_EMBEDDING_RATE_LIMIT: {
    description: 'Query embeddings allowed per client per window',
    schema: Schema.toStandardSchemaV1(Schema.optional(Schema.String)),
  },
  ORFARCHIV_EMBEDDING_RATE_WINDOW: {
    description: 'Rate limit window for query embeddings, e.g. "1 minute"',
    schema: Schema.toStandardSchemaV1(Schema.optional(Schema.String)),
  },
  PUBLIC_APP_MODE: {
    description: 'Controls the app mode',
    static: true,
    public: true,
    schema: Schema.toStandardSchemaV1(Schema.Literals(['dev', 'prod'])),
  },
  PUBLIC_ENABLE_ANALYTICS: {
    description: 'Controls whether vercel analytics are enabled',
    static: true,
    public: true,
    schema: Schema.toStandardSchemaV1(Schema.Literals(['true', 'false'])),
  },
});
