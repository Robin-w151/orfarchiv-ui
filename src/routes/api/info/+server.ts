import { API_VERSION } from '$lib/configs/shared';
import { json } from '@sveltejs/kit';

export const GET = () => {
  return json({
    apiVersion: API_VERSION,
  });
};