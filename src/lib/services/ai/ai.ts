import { AiServiceError } from '$lib/errors/errors';
import type { AiModel } from '$lib/models/ai';
import { logger } from '$lib/utils/logger';
import { Chat, GoogleGenAI, type Schema } from '@google/genai';
import { Effect, Schedule } from 'effect';
import type { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class AiService {
  private readonly ai: GoogleGenAI;
  private chat: Chat | undefined;
  private lastRequestFailed = false;
  constructor(
    private readonly apiKey: string,
    private readonly model: AiModel,
  ) {
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  newChat(keepHistory = false): Effect.Effect<Chat, AiServiceError> {
    return Effect.gen(this, function* () {
      const history = keepHistory ? this.chat?.getHistory(true) : undefined;

      const chat = yield* Effect.tryPromise({
        try: async () => await this.ai.chats.create({ model: this.model, history }),
        catch: (error) => new AiServiceError({ message: 'Failed to create chat', cause: error }),
      });

      yield* Effect.sync(() => {
        this.chat = chat;
      });

      return chat;
    });
  }

  sendMessage<T>(message: string, schema: ZodSchema<T>): Effect.Effect<T, AiServiceError> {
    return Effect.gen(this, function* () {
      let chat = this.lastRequestFailed || !this.chat ? yield* this.newChat(true) : this.chat;
      yield* Effect.sync(() => {
        this.lastRequestFailed = false;
      });

      const responseSchema = this.sanitizeSchema(zodToJsonSchema(schema, { target: 'openApi3' }));
      const response = yield* Effect.gen(this as AiService, function* () {
        if (this.lastRequestFailed) {
          chat = yield* this.newChat(true);
        }

        return yield* Effect.tryPromise({
          try: (abortSignal) => {
            logger.infoGroup(
              'ai-message',
              [
                ['message', message],
                ['response-schema', responseSchema],
              ],
              true,
            );
            return chat.sendMessage({
              message,
              config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema as Schema,
                abortSignal,
              },
            });
          },
          catch: (error) => new AiServiceError({ message: 'Failed to send message', cause: error }),
        });
      }).pipe(
        Effect.tapBoth({
          onSuccess: () =>
            Effect.sync(() => {
              this.lastRequestFailed = false;
            }),
          onFailure: () =>
            Effect.sync(() => {
              this.lastRequestFailed = true;
            }),
        }),
        Effect.retry({ times: 1, schedule: Schedule.exponential(2000) }),
      );
      const responseText = response?.text;

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
          logger.infoGroup('ai-message-response', [['response', validationResponse.data]], true);
        });
        return validationResponse.data;
      } else {
        return yield* Effect.fail(new AiServiceError({ message: 'Invalid response', cause: validationResponse.error }));
      }
    });
  }

  countTokens(message: string): Effect.Effect<number | undefined, AiServiceError> {
    return Effect.gen(this, function* () {
      const chat = this.chat;
      if (!chat) {
        return yield* Effect.fail(new AiServiceError({ message: 'No chat created' }));
      }

      const totalTokens = yield* Effect.tryPromise({
        try: async (abortSignal) =>
          (await this.ai.models.countTokens({ model: this.model, contents: message, config: { abortSignal } }))
            .totalTokens,
        catch: (error) => new AiServiceError({ message: 'Failed to count tokens', cause: error }),
      }).pipe(Effect.retry({ times: 1, schedule: Schedule.exponential(1000) }));

      yield* Effect.sync(() => {
        logger.infoGroup('ai-message-tokens', [['total-tokens', totalTokens]]);
      });

      return totalTokens;
    });
  }

  private sanitizeSchema(schema: object): object {
    const schemaCopy = structuredClone(schema);
    this.removeAdditionalPropertiesRecursive(schemaCopy);
    return schemaCopy;
  }

  private removeAdditionalPropertiesRecursive(schemaObject: any): void {
    if (typeof schemaObject !== 'object' || schemaObject === null || schemaObject === undefined) {
      return;
    }

    if ('additionalProperties' in schemaObject) {
      delete schemaObject.additionalProperties;
    }

    if (schemaObject.properties && typeof schemaObject.properties === 'object') {
      for (const propertyKey in schemaObject.properties) {
        if (Object.prototype.hasOwnProperty.call(schemaObject.properties, propertyKey)) {
          this.removeAdditionalPropertiesRecursive(schemaObject.properties[propertyKey]);
        }
      }
    }

    if (schemaObject.items) {
      if (Array.isArray(schemaObject.items)) {
        for (const item of schemaObject.items) {
          this.removeAdditionalPropertiesRecursive(item);
        }
      } else {
        this.removeAdditionalPropertiesRecursive(schemaObject.items);
      }
    }

    for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
      if (Array.isArray(schemaObject[keyword])) {
        for (const subSchema of schemaObject[keyword]) {
          this.removeAdditionalPropertiesRecursive(subSchema);
        }
      }
    }
  }
}
