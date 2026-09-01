import orfArchivDb from '$lib/backend/db/init';
import { SearchError } from '$lib/errors/errors';
import { StoryEntity, type Story } from '$lib/models/story';
import { Effect, Schema } from 'effect';
import type { Collection } from 'mongodb';

export const isStoryEntity = Schema.is(StoryEntity);

export function useNewsCollection<TResult>(
  message: string,
  use: (newsCollection: Collection<Document>) => Promise<TResult>,
): Effect.Effect<TResult, SearchError> {
  return Effect.tryPromise({
    try: () => use(orfArchivDb.newsCollection()),
    catch: (cause) => new SearchError({ message, cause }),
  });
}

export function mapToStory(entry: StoryEntity): Story {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category ?? undefined,
    url: entry.url,
    timestamp: entry.timestamp.toISOString(),
    source: entry.source,
  };
}

export function parseDate(date: string | null | undefined): Date | undefined {
  if (!date) {
    return undefined;
  }

  const dateObject = new Date(date);
  if (Number.isNaN(dateObject.getTime())) {
    return undefined;
  }

  return dateObject;
}
