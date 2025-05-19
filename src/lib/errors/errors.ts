import { Data } from 'effect';

// Story content
export class ContentNotFoundError extends Error {}
export class OptimizedContentIsEmptyError extends Error {}

// AI
export const AiServiceErrorTypes = ['INVALID_REQUEST', 'TIMEOUT', 'RATE_LIMIT'] as const;
export type AiServiceErrorType = (typeof AiServiceErrorTypes)[number];
export class AiServiceError extends Data.TaggedError('AiServiceError')<{
  message: string;
  type?: AiServiceErrorType;
  cause?: unknown;
}> {}
