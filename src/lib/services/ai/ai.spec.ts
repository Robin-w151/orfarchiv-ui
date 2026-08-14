import { AI_MODEL_CONFIG_MAP } from '$lib/configs/client';
import { AiServiceError } from '$lib/errors/errors';
import type { AiModel } from '$lib/models/ai';
import { Effect, Either } from 'effect';
import { APIError } from 'openai';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { AiService } from './ai';

const { mockedCreate } = vi.hoisted(() => {
  return { mockedCreate: vi.fn() };
});

vi.mock('openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openai')>();

  class MockOpenAI {
    readonly chat = { completions: { create: mockedCreate } };
  }

  return { ...actual, default: MockOpenAI };
});

vi.mock('$lib/utils/logger', () => {
  return {
    logger: { info: vi.fn(), infoGroup: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
});

const mockApiKey = 'test-api-key';
const mockModel: AiModel = 'gemini-3.5-flash';
const mockMessage = 'Summarize this story';

const TestSchema = z.object({ summary: z.string() });

describe('AI service', () => {
  beforeEach(() => {
    mockedCreate.mockReset();
  });

  describe('sendMessage', () => {
    test('returns the parsed and validated response', async () => {
      mockCompletion('{"summary":"Hello World"}');

      const result = await sendMessage();

      expect(Either.isRight(result)).toBe(true);
      expect(Either.isRight(result) ? result.right : undefined).toEqual({ summary: 'Hello World' });
    });

    test('sends the model configuration of the selected model', async () => {
      mockCompletion('{"summary":"Hello World"}');

      await sendMessage();

      const modelConfig = AI_MODEL_CONFIG_MAP[mockModel];
      expect(mockedCreate).toHaveBeenCalledTimes(1);
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: modelConfig.modelCode,
          reasoning_effort: modelConfig.reasoningEffort,
          messages: [{ role: 'user', content: mockMessage }],
        }),
        expect.objectContaining({ maxRetries: 0 }),
      );
    });

    test('fails when the response has no content', async () => {
      mockCompletion(null);

      const error = await sendMessageError();

      expect(error).toBeInstanceOf(AiServiceError);
      expect(error?.message).toBe('No response from AI');
    });

    test('fails when the response is not valid JSON', async () => {
      mockCompletion('not json at all');

      const error = await sendMessageError();

      expect(error).toBeInstanceOf(AiServiceError);
      expect(error?.message).toBe('Failed to parse response');
    });

    test('fails when the response does not match the schema', async () => {
      mockCompletion('{"summary":42}');

      const error = await sendMessageError();

      expect(error).toBeInstanceOf(AiServiceError);
      expect(error?.message).toBe('Invalid response');
    });

    describe('Error types', () => {
      test('maps a 400 response to INVALID_REQUEST and does not retry', async () => {
        mockApiError(400, 'Bad request');

        const error = await sendMessageError();

        expect(error?.type).toBe('INVALID_REQUEST');
        expect(mockedCreate).toHaveBeenCalledTimes(1);
      });

      test('maps a 404 response to INVALID_REQUEST and does not retry', async () => {
        mockApiError(404, 'Not found');

        const error = await sendMessageError();

        expect(error?.type).toBe('INVALID_REQUEST');
        expect(mockedCreate).toHaveBeenCalledTimes(1);
      });

      test('maps an invalid API key to API_KEY_INVALID and does not retry', async () => {
        mockApiError(400, 'Please pass a valid API key');

        const error = await sendMessageError();

        expect(error?.type).toBe('API_KEY_INVALID');
        expect(mockedCreate).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('countWords', () => {
    test('counts the words of a message', async () => {
      const result = await Effect.runPromise(newService().countWords('Hello beautiful World'));

      expect(result).toBe(3);
    });

    test('ignores surrounding and repeated whitespace', async () => {
      const result = await Effect.runPromise(newService().countWords('  Hello   World  '));

      expect(result).toBe(2);
    });

    test('counts an empty message as zero words', async () => {
      const result = await Effect.runPromise(newService().countWords('   '));

      expect(result).toBe(0);
    });
  });
});

function newService(): AiService {
  return new AiService(mockApiKey, mockModel);
}

function sendMessage(): Promise<Either.Either<z.infer<typeof TestSchema>, AiServiceError>> {
  return Effect.runPromise(Effect.either(newService().sendMessage(mockMessage, TestSchema)));
}

async function sendMessageError(): Promise<AiServiceError | undefined> {
  const result = await sendMessage();
  return Either.isLeft(result) ? result.left : undefined;
}

function mockCompletion(content: string | null): void {
  mockedCreate.mockResolvedValue({
    choices: [{ message: { content } }],
    usage: { total_tokens: 30, prompt_tokens: 10, completion_tokens: 20 },
  });
}

function mockApiError(status: number, message: string): void {
  const body = [{ error: { code: status, message, status: 'ERROR' } }];
  mockedCreate.mockRejectedValue(new APIError(status, body, message, undefined));
}
