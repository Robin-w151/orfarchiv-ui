import { AiServiceError } from '$lib/errors/errors';
import type { AiModel } from '$lib/models/ai';
import { Chat, GoogleGenAI, type Schema } from '@google/genai';
import { Effect } from 'effect';
import type { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class AiService {
  private readonly ai: GoogleGenAI;
  private chat: Chat | undefined;

  constructor(
    private readonly apiKey: string,
    private readonly model: AiModel,
  ) {
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  newChat(): Effect.Effect<void, AiServiceError> {
    const self = this;
    return Effect.gen(function* () {
      const chat = yield* Effect.tryPromise({
        try: async () => await self.ai.chats.create({ model: self.model }),
        catch: (error) => new AiServiceError({ message: 'Failed to create chat', cause: error }),
      });

      yield* Effect.sync(() => {
        self.chat = chat;
      });
    });
  }

  sendMessage<T>(message: string, schema: ZodSchema<T>): Effect.Effect<T, AiServiceError> {
    const self = this;
    return Effect.gen(function* () {
      const chat = self.chat;
      if (!chat) {
        return yield* Effect.fail(new AiServiceError({ message: 'No chat created' }));
      }

      const responseSchema = self.sanitizeSchema(zodToJsonSchema(schema, { target: 'openApi3' }));
      const response = (yield* Effect.tryPromise({
        try: (abortSignal) =>
          chat.sendMessage({
            message,
            config: {
              responseMimeType: 'application/json',
              responseSchema: responseSchema as Schema,
              abortSignal,
            },
          }),
        catch: (error) => new AiServiceError({ message: 'Failed to send message', cause: error }),
      })).text;

      if (!response) {
        return yield* Effect.fail(new AiServiceError({ message: 'No response from AI' }));
      }

      const parsedResponse = yield* Effect.try({
        try: () => JSON.parse(response),
        catch: (error) => new AiServiceError({ message: 'Failed to parse response', cause: error }),
      });

      const validationResponse = yield* Effect.try({
        try: () => schema.safeParse(parsedResponse),
        catch: (error) => new AiServiceError({ message: 'Failed to validate response', cause: error }),
      });

      if (parsedResponse && validationResponse.success) {
        return validationResponse.data;
      } else {
        return yield* Effect.fail(new AiServiceError({ message: 'Invalid response', cause: validationResponse.error }));
      }
    });
  }

  countTokens(message: string): Effect.Effect<number | undefined, AiServiceError> {
    const self = this;
    return Effect.gen(function* () {
      const chat = self.chat;
      if (!chat) {
        return yield* Effect.fail(new AiServiceError({ message: 'No chat created' }));
      }

      return yield* Effect.tryPromise({
        try: async (abortSignal) =>
          (await self.ai.models.countTokens({ model: self.model, contents: message, config: { abortSignal } }))
            .totalTokens,
        catch: (error) => new AiServiceError({ message: 'Failed to count tokens', cause: error }),
      });
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
