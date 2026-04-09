import { Data } from 'effect';

// Error Tags
export type Tags = Array<Tag>;
export type Tag = [string, string];

export function formatTags(tags: Tags): string {
  return tags.map(([key, value]) => `${key}='${value}'`).join(', ');
}

// News API
export class NewsApiError extends Data.TaggedError('NewsApiError')<{
  message: string;
  type: NewsApiErrorType;
  cause?: unknown;
}> {}
export type NewsApiErrorType = 'error' | 'cancelled';

// Story content
export type FetchStoryContentError =
  | FetchError
  | ParseError
  | MetaDataNotFoundError
  | ContentNotFoundError
  | OptimizedContentIsEmptyError;
export class FetchError extends Data.TaggedError('FetchError')<{ url: string; tags: Tags; cause?: unknown }> {}
export class ParseError extends Data.TaggedError('ParseError')<{ url: string; tags: Tags; cause?: unknown }> {}
export class MetaDataNotFoundError extends Data.TaggedError('MetaDataNotFoundError')<{
  url: string;
  tags: Tags;
  cause?: unknown;
}> {}
export class ContentNotFoundError extends Data.TaggedError('ContentNotFoundError')<{
  url: string;
  tags: Tags;
  message: string;
}> {}
export class OptimizedContentIsEmptyError extends Data.TaggedError('OptimizedContentIsEmptyError')<{
  url: string;
  tags: Tags;
  message: string;
}> {}

// AI
export const AiServiceErrorTypes = ['INVALID_REQUEST', 'TIMEOUT', 'RATE_LIMIT'] as const;
export type AiServiceErrorType = (typeof AiServiceErrorTypes)[number];
export class AiServiceError extends Data.TaggedError('AiServiceError')<{
  message: string;
  type?: AiServiceErrorType;
  cause?: unknown;
}> {}
