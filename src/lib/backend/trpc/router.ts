import {
  STORY_CONTENT_DEFAULT_MAXAGE,
  STORY_CONTENT_NEW_STORY_MAXAGE,
  STORY_CONTENT_NEW_STORY_THRESHOLD,
} from '$lib/configs/server';
import { API_VERSION } from '$lib/configs/shared';
import { SearchRequest } from '$lib/models/searchRequest';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { isOrfUrl } from '../../utils/urls';
import { fetchStoryContent } from '../content/news';
import { checkNewsUpdatesAvailable, searchNews } from '../db/news';
import { publicProcedure, router } from './init';

const info = publicProcedure.query(() => ({
  apiVersion: API_VERSION,
}));

const news = {
  search: publicProcedure.input(SearchRequest).query(async ({ input, ctx }) => {
    const news = await searchNews(input);
    ctx.event.setHeaders({
      'Cache-Control': 'max-age=0, s-maxage=300',
    });
    return news;
  }),
  checkUpdates: publicProcedure.input(SearchRequest).query(async ({ input, ctx }) => {
    const newsUpdates = await checkNewsUpdatesAvailable(input);
    ctx.event.setHeaders({
      'Cache-Control': 'max-age=0, s-maxage=300',
    });
    return newsUpdates;
  }),
  content: publicProcedure
    .input(
      z.object({
        url: z.string().url().refine(isOrfUrl, { message: 'URL is not a valid ORF URL' }),
        fetchReadMoreContent: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { url, fetchReadMoreContent } = input;
      const content = await fetchStoryContent(url, fetchReadMoreContent);
      const maxage = getMaxAge(content.timestamp);
      ctx.event.setHeaders({
        'Cache-Control': `max-age=0, s-maxage=${maxage}`,
      });
      return content;
    }),
};

export const appRouter = router({
  info,
  news,
});

export type AppRouter = typeof appRouter;

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
