import { Data } from 'effect';

// Story content
export type FetchStoryContentError =
  | FetchError
  | ParseError
  | MetaDataNotFoundError
  | ContentNotFoundError
  | OptimizedContentIsEmptyError;
export class FetchError extends Data.TaggedError('FetchError')<{ url: string; cause?: unknown }> {}
export class ParseError extends Data.TaggedError('ParseError')<{ url: string; cause?: unknown }> {}
export class MetaDataNotFoundError extends Data.TaggedError('MetaDataNotFoundError')<{
  url: string;
  message: string;
  cause?: unknown;
}> {}
export class ContentNotFoundError extends Data.TaggedError('ContentNotFoundError')<{ url: string; message: string }> {}
export class OptimizedContentIsEmptyError extends Data.TaggedError('OptimizedContentIsEmptyError')<{
  url: string;
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
