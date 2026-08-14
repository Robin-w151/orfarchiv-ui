import { AI_MODEL_CONFIG_MAP } from '$lib/configs/client';
import { AiServiceError } from '$lib/errors/errors';
import type { AiModel } from '$lib/models/ai';
import { it } from '@effect/vitest';
import { Duration, Effect, Fiber, Result } from 'effect';
import { TestClock } from 'effect/testing';
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

      expect(Result.isSuccess(result)).toBe(true);
      expect(Result.isSuccess(result) ? result.success : undefined).toEqual({ summary: 'Hello World' });
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

    describe('Retrying', () => {
      it.effect('retries a rate limited request once', () =>
        Effect.gen(function* () {
          mockApiError(429, 'Rate limit exceeded');

          const error = yield* runWithClock(retryDelay);

          expect(error?.type).toBe('RATE_LIMIT');
          expect(mockedCreate).toHaveBeenCalledTimes(2);
        }),
      );

      it.effect('retries an overloaded model once', () =>
        Effect.gen(function* () {
          mockApiError(503, 'Model overloaded');

          const error = yield* runWithClock(retryDelay);

          expect(error?.type).toBe('MODEL_OVERLOADED');
          expect(mockedCreate).toHaveBeenCalledTimes(2);
        }),
      );

      it.effect('retries an unrecognised error shape and leaves the type undefined', () =>
        Effect.gen(function* () {
          mockedCreate.mockRejectedValue(new Error('boom'));

          const error = yield* runWithClock(retryDelay);

          expect(error).toBeInstanceOf(AiServiceError);
          expect(error?.type).toBeUndefined();
          expect(mockedCreate).toHaveBeenCalledTimes(2);
        }),
      );
    });

    describe('Timing out', () => {
      it.effect('fails with TIMEOUT when the response never arrives', () =>
        Effect.gen(function* () {
          mockedCreate.mockImplementation(() => new Promise(() => {}));

          // The timeout sits inside the retry, so the request has to time out
          // twice (with the retry delay in between) before the error surfaces.
          const error = yield* runWithClock(requestTimeout, retryDelay, requestTimeout);

          expect(error).toBeInstanceOf(AiServiceError);
          expect(error?.type).toBe('TIMEOUT');
          expect(error?.message).toBe('Response generation timed out');
          expect(mockedCreate).toHaveBeenCalledTimes(2);
        }),
      );
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

// `Effect.timeout('2 minutes')`, and `Schedule.exponential(5000).pipe(Schedule.jittered)`
// which scales the delay by a 0.8-1.2 factor — so advance past the upper bound.
const requestTimeout: Duration.Input = '2 minutes';
const retryDelay: Duration.Input = '10 seconds';

function newService(): AiService {
  return new AiService(mockApiKey, mockModel);
}

/**
 * Runs `sendMessage` on a forked fiber, advancing the `TestClock` by each of the
 * given durations, and returns the resulting error. Lets the timeout and retry
 * delays elapse instantly instead of in real time.
 */
function runWithClock(...durations: ReadonlyArray<Duration.Input>): Effect.Effect<AiServiceError | undefined> {
  return Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(Effect.result(newService().sendMessage(mockMessage, TestSchema)));

    for (const duration of durations) {
      yield* TestClock.adjust(duration);
    }

    const result = yield* Fiber.join(fiber);
    return Result.isFailure(result) ? result.failure : undefined;
  });
}

function sendMessage(): Promise<Result.Result<z.infer<typeof TestSchema>, AiServiceError>> {
  return Effect.runPromise(Effect.result(newService().sendMessage(mockMessage, TestSchema)));
}

async function sendMessageError(): Promise<AiServiceError | undefined> {
  const result = await sendMessage();
  return Result.isFailure(result) ? result.failure : undefined;
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
