import { fetchStoryContent } from '$lib/backend/content/news';
import { getFetchReadMoreContentSearchParam, getUrlSearchParam } from '$lib/backend/utils/searchParams';
import { isOrfUrl } from '$lib/backend/utils/urls';
import {
  STORY_CONTENT_DEFAULT_MAXAGE,
  STORY_CONTENT_NEW_STORY_MAXAGE,
  STORY_CONTENT_NEW_STORY_THRESHOLD,
} from '$lib/configs/server';
import { ContentNotFoundError, OptimizedContentIsEmptyError } from '$lib/errors/errors';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { DateTime } from 'luxon';

export const GET = (async (event: RequestEvent) => {
  const url = getUrlSearchParam(event);
  if (!url || !isOrfUrl(url)) {
    return new Response(undefined, { status: 400 });
  }

  try {
    const fetchReadMoreContent = getFetchReadMoreContentSearchParam(event);
    const content = await fetchStoryContent(url, fetchReadMoreContent);
    const maxage = getMaxAge(content.timestamp);
    return json(content, {
      headers: {
        'Cache-Control': `max-age=0, s-maxage=${maxage}`,
      },
    });
  } catch (error: any) {
    console.warn(`Error: ${error.message}`);

    if (error instanceof ContentNotFoundError || error instanceof OptimizedContentIsEmptyError) {
      return new Response(undefined, { status: 404 });
    }

    return new Response(undefined, { status: 500 });
  }
}) satisfies RequestHandler;

function getMaxAge(timestamp?: string): number {
  if (!timestamp) {
    return STORY_CONTENT_DEFAULT_MAXAGE;
  }

  const now = DateTime.now();
  const parsedTimestamp = DateTime.fromISO(timestamp);
  if (parsedTimestamp.invalidReason) {
    return STORY_CONTENT_DEFAULT_MAXAGE;
  }

  const ageInHours = now.diff(parsedTimestamp, 'hours').hours;
  if (ageInHours < STORY_CONTENT_NEW_STORY_THRESHOLD) {
    return STORY_CONTENT_NEW_STORY_MAXAGE;
  } else {
    return STORY_CONTENT_DEFAULT_MAXAGE;
  }
}
