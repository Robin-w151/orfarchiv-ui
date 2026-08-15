import {
  STORY_CONTENT_DEFAULT_MAXAGE,
  STORY_CONTENT_NEW_STORY_MAXAGE,
  STORY_CONTENT_NEW_STORY_THRESHOLD,
} from '$lib/configs/server';
import { API_VERSION } from '$lib/configs/shared';
import { isOrfUrl, isUrl } from '$lib/models/checks';
import { SearchRequest } from '$lib/models/searchRequest';
import { TRPCError } from '@trpc/server';
import { Result, Schema } from 'effect';
import { DateTime } from 'luxon';
import { fetchStoryContent } from '../content/news';
import { checkNewsUpdatesAvailable, searchNews } from '../db/news';
import { publicProcedure, router } from './init';

const info = publicProcedure.query(() => ({
  apiVersion: API_VERSION,
}));

const StoryContentRequest = Schema.Struct({
  url: Schema.String.check(isUrl, isOrfUrl),
  fetchReadMoreContent: Schema.optional(Schema.Boolean),
});

const news = {
  search: publicProcedure.input(Schema.toStandardSchemaV1(SearchRequest)).query(async ({ input, ctx }) => {
    const news = await searchNews(input);
    ctx.event.setHeaders({
      'Cache-Control': 'max-age=0, s-maxage=300',
    });
    return news;
  }),
  checkUpdates: publicProcedure.input(Schema.toStandardSchemaV1(SearchRequest)).query(async ({ input, ctx }) => {
    const newsUpdates = await checkNewsUpdatesAvailable(input);
    ctx.event.setHeaders({
      'Cache-Control': 'max-age=0, s-maxage=300',
    });
    return newsUpdates;
  }),
  content: publicProcedure.input(Schema.toStandardSchemaV1(StoryContentRequest)).query(async ({ input, ctx }) => {
    const { url, fetchReadMoreContent } = input;
    const content = await fetchStoryContent(url, fetchReadMoreContent);
    if (Result.isFailure(content)) {
      switch (content.failure._tag) {
        case 'MetaDataNotFoundError':
        case 'ContentNotFoundError': {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: content.failure.message,
          });
        }
        default: {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unknown error',
            cause: content.failure,
          });
        }
      }
    }

    const maxage = getMaxAge(content.success.timestamp);
    ctx.event.setHeaders({
      'Cache-Control': `max-age=0, s-maxage=${maxage}`,
    });
    return content.success;
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
