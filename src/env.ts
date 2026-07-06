import { defineEnvVars } from '@sveltejs/kit/hooks';
import z from 'zod';

export const variables = defineEnvVars({
  ORFARCHIV_DB_URL: {
    description: 'URL of the ORF Archiv database',
    schema: z.url(),
  },
  PUBLIC_APP_MODE: {
    description: 'Controls the app mode',
    static: true,
    public: true,
    schema: z.enum(['dev', 'prod']),
  },
  PUBLIC_ENABLE_ANALYTICS: {
    description: 'Controls whether vercel analytics are enabled',
    static: true,
    public: true,
    schema: z.enum(['true', 'false']),
  },
});
