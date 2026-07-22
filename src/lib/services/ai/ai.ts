import { AI_MODEL_CONFIG_MAP } from '$lib/configs/client';
import { AiServiceError, type AiServiceErrorType } from '$lib/errors/errors';
import { OpenAIError, type AiModel } from '$lib/models/ai';
import { logger } from '$lib/utils/logger';
import { Effect, Schedule } from 'effect';
import OpenAI, { APIError } from 'openai';
import { makeParseableResponseFormat, type AutoParseableResponseFormat } from 'openai/lib/parser';
import type { ResponseFormatJSONSchema } from 'openai/resources';
import { z, type ZodType } from 'zod';

export class AiService {
  private readonly ai: OpenAI;

  constructor(
    private readonly apiKey: string,
    private readonly model: AiModel,
  ) {
    this.ai = this.newClient();
  }

  sendMessage<T>(message: string, schema: ZodType<T>): Effect.Effect<T, AiServiceError> {
    return Effect.gen(this, function* () {
      const modelConfig = AI_MODEL_CONFIG_MAP[this.model];

      yield* Effect.sync(() => {
        logger.infoGroup(
          'ai-message',
          [
            ['model', modelConfig.modelCode],
            ['reasoning-effort', modelConfig.reasoningEffort],
            ['message', message],
            ['response-schema', schema],
          ],
          true,
        );
      });

      const response = yield* Effect.tryPromise({
        try: (abortSignal) => {
          return this.ai.chat.completions.create(
            {
              model: modelConfig.modelCode,
              messages: [{ role: 'user', content: message }],
              response_format: this.zodResponseFormat(schema, 'json_object'),
              reasoning_effort: modelConfig.reasoningEffort,
            },
            { signal: abortSignal, maxRetries: 0 },
          );
        },
        catch: (error) => {
          let type: AiServiceErrorType | undefined;
          if (error instanceof APIError) {
            type = this.getErrorType(error);
          }

          return new AiServiceError({ message: 'Failed to send message', type, cause: error });
        },
      }).pipe(
        Effect.timeout('2 minutes'),
        Effect.retry({
          times: 1,
          schedule: Schedule.exponential(5000).pipe(Schedule.jittered),
          while: (error) => this.isErrorRetryable(error),
        }),
        Effect.catchTag(
          'TimeoutException',
          (error) => new AiServiceError({ message: 'Response generation timed out', type: 'TIMEOUT', cause: error }),
        ),
      );

      const responseText = response?.choices[0]?.message.content;
      if (!responseText) {
        return yield* Effect.fail(new AiServiceError({ message: 'No response from AI' }));
      }

      const parsedResponse = yield* Effect.try({
        try: () => JSON.parse(responseText),
        catch: (error) => new AiServiceError({ message: 'Failed to parse response', cause: error }),
      });

      const validationResponse = yield* Effect.try({
        try: () => schema.safeParse(parsedResponse),
        catch: (error) => new AiServiceError({ message: 'Failed to validate response', cause: error }),
      });

      if (parsedResponse && validationResponse.success) {
        yield* Effect.sync(() => {
          logger.infoGroup(
            'ai-message-response',
            [
              ['response', validationResponse.data],
              ['total-tokens', response.usage?.total_tokens],
              ['prompt-tokens', response.usage?.prompt_tokens],
              ['completion-tokens', response.usage?.completion_tokens],
            ],
            true,
          );
        });
        return validationResponse.data;
      } else {
        return yield* Effect.fail(new AiServiceError({ message: 'Invalid response', cause: validationResponse.error }));
      }
    });
  }

  countWords(message: string): Effect.Effect<number> {
    return Effect.gen(this, function* () {
      const totalWords = message.split(/\s+/).filter(Boolean).length;

      yield* Effect.sync(() => {
        logger.infoGroup('ai-message-words', [['total-words', totalWords]]);
      });

      return totalWords;
    });
  }

  private newClient(): OpenAI {
    return new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'x-stainless-arch': null,
        'x-stainless-lang': null,
        'x-stainless-os': null,
        'x-stainless-package-version': null,
        'x-stainless-retry-count': null,
        'x-stainless-runtime': null,
        'x-stainless-runtime-version': null,
        'x-stainless-timeout': null,
      },
    });
  }

  private zodResponseFormat<ZodInput extends ZodType>(
    zodObject: ZodInput,
    name: string,
    props?: Omit<ResponseFormatJSONSchema.JSONSchema, 'schema' | 'strict' | 'name'>,
  ): AutoParseableResponseFormat<z.infer<ZodInput>> {
    return makeParseableResponseFormat(
      {
        type: 'json_schema',
        json_schema: {
          ...props,
          name,
          strict: true,
          schema: z.toJSONSchema(zodObject, { target: 'draft-7' }),
        },
      },
      (content) => zodObject.parse(JSON.parse(content)),
    );
  }

  private getErrorType(error: APIError): AiServiceErrorType | undefined {
    const parsedError = OpenAIError.safeParse(error);
    if (!parsedError.success) {
      return undefined;
    }

    const { message } = parsedError.data.error[0].error;
    if (message === 'Please pass a valid API key') {
      return 'API_KEY_INVALID';
    }

    switch (parsedError.data.status) {
      case 400:
      case 404:
        return 'INVALID_REQUEST';
      case 429:
        return 'RATE_LIMIT';
      case 503:
        return 'MODEL_OVERLOADED';
    }

    return undefined;
  }

  private isErrorRetryable(error: unknown): boolean {
    if (error instanceof AiServiceError) {
      switch (error.type) {
        case 'INVALID_REQUEST':
        case 'API_KEY_INVALID': {
          return false;
        }
        default: {
          return true;
        }
      }
    }

    return true;
  }
}
