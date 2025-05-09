import { Data } from 'effect';

export class ContentNotFoundError extends Error {}

export class OptimizedContentIsEmptyError extends Error {}

export class AiServiceError extends Data.TaggedError('AiServiceError')<{ message: string; cause?: unknown }> {}
