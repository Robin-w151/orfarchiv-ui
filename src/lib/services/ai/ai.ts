import type { AiModel } from '$lib/models/ai';
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

  async sendMessage<T>(message: string, schema: ZodSchema<T>): Promise<T> {
    if (!this.chat) {
      throw new Error('No chat created');
    }

    const responseSchema = zodToJsonSchema(schema, { target: 'openApi3' });
    const response = (
      await this.chat.sendMessage({
        message,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema as Schema,
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
  }
}
