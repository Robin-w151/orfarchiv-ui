import { building } from '$app/env';
import orfArchivDb from '$lib/backend/db/init';
import type { Handle } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
  if (!building) {
    await orfArchivDb.init();
  }
  return resolve(event);
}) satisfies Handle;
