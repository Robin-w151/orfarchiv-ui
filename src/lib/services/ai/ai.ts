import { AI_MODEL_CONFIG_MAP } from '$lib/configs/client';
import { AiServiceError, type AiServiceErrorType } from '$lib/errors/errors';
import type { AiModel } from '$lib/models/ai';
import * as GeminiLanguageModel from '$lib/services/ai/gemini/geminiLanguageModel';
import { logger } from '$lib/utils/logger';
import { Effect, Schedule, Schema } from 'effect';
import { AiError, LanguageModel } from 'effect/unstable/ai';
import { FetchHttpClient } from 'effect/unstable/http';

export class AiService {
  constructor(
    private readonly apiKey: string,
    private readonly model: AiModel,
  ) {}

  sendMessage<S extends Schema.Codec<unknown, Record<string, unknown>>>(
    message: string,
    schema: S,
  ): Effect.Effect<S['Type'], AiServiceError> {
    return Effect.gen({ self: this }, function* () {
      const modelConfig = AI_MODEL_CONFIG_MAP[this.model];

      yield* Effect.sync(() => {
        logger.infoGroup(
          'ai-message',
          [
            ['model', modelConfig.modelCode],
            ['reasoning-effort', modelConfig.reasoningEffort],
            ['message', message],
          ],
          true,
        );
      });

      const response = yield* LanguageModel.generateObject({
        prompt: message,
        schema,
        objectName: 'json_object',
      }).pipe(
        Effect.provide(GeminiLanguageModel.layer({ apiKey: this.apiKey, model: this.model })),
        Effect.provide(FetchHttpClient.layer),
        Effect.catchTag('AiError', (error) => this.toAiServiceError(error)),
        Effect.timeout('2 minutes'),
        Effect.retry({
          times: 1,
          schedule: Schedule.exponential(5000).pipe(Schedule.jittered),
          while: (error) => this.isErrorRetryable(error),
        }),
        Effect.catchTag(
          'TimeoutError',
          (error) => new AiServiceError({ message: 'Response generation timed out', type: 'TIMEOUT', cause: error }),
        ),
      );

      const { inputTokens, outputTokens } = response.usage;
      yield* Effect.sync(() => {
        logger.infoGroup(
          'ai-message-response',
          [
            ['response', response.value],
            ['total-tokens', (inputTokens.total ?? 0) + (outputTokens.total ?? 0)],
            ['prompt-tokens', inputTokens.total],
            ['completion-tokens', outputTokens.total],
          ],
          true,
        );
      });

      return response.value;
    });
  }

  countWords(message: string): Effect.Effect<number> {
    return Effect.gen({ self: this }, function* () {
      const totalWords = message.split(/\s+/).filter(Boolean).length;

      yield* Effect.sync(() => {
        logger.infoGroup('ai-message-words', [['total-words', totalWords]]);
      });

      return totalWords;
    });
  }

  private toAiServiceError(error: AiError.AiError): Effect.Effect<never, AiServiceError> {
    const message = this.isResponseError(error) ? 'Invalid response' : 'Failed to send message';
    return Effect.fail(new AiServiceError({ message, type: this.getErrorType(error), cause: error }));
  }

  private getErrorType(error: AiError.AiError): AiServiceErrorType | undefined {
    switch (error.reason._tag) {
      case 'AuthenticationError':
        return 'API_KEY_INVALID';
      case 'InvalidRequestError':
        return 'INVALID_REQUEST';
      case 'RateLimitError':
      case 'QuotaExhaustedError':
        return 'RATE_LIMIT';
      case 'InternalProviderError':
        return error.reason.http?.response?.status === 503 ? 'MODEL_OVERLOADED' : undefined;
      default:
        return undefined;
    }
  }

  private isErrorRetryable(error: unknown): boolean {
    if (error instanceof AiServiceError) {
      switch (error.type) {
        case 'INVALID_REQUEST':
        case 'API_KEY_INVALID': {
          return false;
        }
        default: {
          return !this.isResponseError(error.cause);
        }
      }
    }

    return true;
  }

  private isResponseError(error: unknown): boolean {
    if (!(error instanceof AiError.AiError)) {
      return false;
    }

    switch (error.reason._tag) {
      case 'InvalidOutputError':
      case 'StructuredOutputError':
      case 'UnsupportedSchemaError':
      case 'InvalidUserInputError':
        return true;
      default:
        return false;
    }
  }
}
