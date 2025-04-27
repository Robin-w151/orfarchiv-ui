import type { AiModel } from '$lib/models/ai';
import type { Request } from '$lib/models/request';
import { Chat, GoogleGenAI, type Schema } from '@google/genai';
import type { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class AiService {
  private readonly ai: GoogleGenAI;
  private chat: Chat | undefined;

  constructor(readonly apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async newChat(model: AiModel): Promise<void> {
    this.chat = await this.ai.chats.create({ model });
  }

  sendMessage<T>(message: string, schema: ZodSchema<T>): Request<T> {
    const chat = this.chat;
    if (!chat) {
      throw new Error('No chat created');
    }

    const responseSchema = this.sanitizeSchema(zodToJsonSchema(schema, { target: 'openApi3' }));
    const abortController = new AbortController();
    const request = async (): Promise<T> => {
      const response = (
        await chat.sendMessage({
          message,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema as Schema,
            abortSignal: abortController.signal,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        })
      ).text;

      if (!response) {
        throw new Error('No response from AI');
      }

      const parsedResponse = JSON.parse(response);
      const validationResponse = schema.safeParse(parsedResponse);
      if (parsedResponse && validationResponse.success) {
        return validationResponse.data;
      } else {
        throw new Error(validationResponse.error?.message);
      }
    };

    return {
      request: request(),
      cancel: () => abortController.abort(),
    };
  }

  async countTokens(message: string, model: AiModel): Promise<number | undefined> {
    if (!this.chat) {
      throw new Error('No chat created');
    }

    return (await this.ai.models.countTokens({ model, contents: message })).totalTokens;
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
