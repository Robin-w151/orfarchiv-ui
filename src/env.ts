import { isUrl } from '$lib/models/checks';
import { defineEnvVars } from '@sveltejs/kit/env';
import { Schema } from 'effect';

export const variables = defineEnvVars({
  ORFARCHIV_DB_URL: {
    description: 'URL of the ORF Archiv database',
    schema: Schema.toStandardSchemaV1(Schema.String.check(isUrl)),
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
