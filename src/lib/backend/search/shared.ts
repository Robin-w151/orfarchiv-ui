import { StoryEntity, type Story } from '$lib/models/story';
import { Schema } from 'effect';

export const isStoryEntity = Schema.is(StoryEntity);

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
