import { AI_MODEL_CONFIG_MAP } from '$lib/configs/client';
import { AiServiceError } from '$lib/errors/errors';
import type { AiModel } from '$lib/models/ai';
import { it } from '@effect/vitest';
import { Duration, Effect, Fiber, Result, Schema } from 'effect';
import { TestClock } from 'effect/testing';
import { FetchHttpClient } from 'effect/unstable/http';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AiService } from './ai';

vi.mock('$lib/utils/logger', () => {
  return {
    logger: { info: vi.fn(), infoGroup: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
});

const mockApiKey = 'test-api-key';
const mockModel = 'gemini-3.5-flash' satisfies AiModel;
const mockMessage = 'Summarize this story';

const TestSchema = Schema.Struct({ summary: Schema.String });

const mockedFetch = vi.fn<typeof globalThis.fetch>();

describe('AI service', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
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
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(requestBody()).toEqual(
        expect.objectContaining({
          model: modelConfig.modelCode,
          reasoning_effort: modelConfig.reasoningEffort,
          messages: [{ role: 'user', content: mockMessage }],
        }),
      );
    });

    test('requests the response as a strict json schema', async () => {
      mockCompletion('{"summary":"Hello World"}');

      await sendMessage();

      expect(requestBody().response_format).toEqual(
        expect.objectContaining({
          type: 'json_schema',
          json_schema: expect.objectContaining({ name: 'json_object', strict: true }),
        }),
      );
    });

    test('sends the api key as a bearer token', async () => {
      mockCompletion('{"summary":"Hello World"}');

      await sendMessage();

      const [url, init] = mockedFetch.mock.calls[0] ?? [];
      expect(String(url)).toBe('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
      expect((init?.headers as Record<string, string>).authorization).toBe(`Bearer ${mockApiKey}`);
    });

    test('sends no headers that gemini rejects in the cors preflight', async () => {
      mockCompletion('{"summary":"Hello World"}');

      await sendMessage();

      const headers = mockedFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
      expect(Object.keys(headers).sort()).toEqual(['accept', 'authorization', 'content-type']);
    });

    test('fails when the response has no content', async () => {
      mockCompletion(null);

      const error = await sendMessageError();

      expect(error).toBeInstanceOf(AiServiceError);
      expect(error?.type).toBeUndefined();
    });

    test('fails when the response is not valid JSON', async () => {
      mockCompletion('not json at all');

      const error = await sendMessageError();

      expect(error).toBeInstanceOf(AiServiceError);
      expect(error?.type).toBeUndefined();
    });

    test('fails when the response does not match the schema', async () => {
      mockCompletion('{"summary":42}');

      const error = await sendMessageError();

      expect(error).toBeInstanceOf(AiServiceError);
      expect(error?.type).toBeUndefined();
    });

    describe('Error types', () => {
      test.for([
        { name: 'a 400 response', status: 400, message: 'Bad request', type: 'INVALID_REQUEST' },
        { name: 'a 404 response', status: 404, message: 'Not found', type: 'INVALID_REQUEST' },
        { name: 'an invalid API key', status: 400, message: 'Please pass a valid API key', type: 'API_KEY_INVALID' },
      ])('maps $name to $type and does not retry', async ({ status, message, type }) => {
        mockApiError(status, message);

        const error = await sendMessageError();

        expect(error?.type).toBe(type);
        expect(mockedFetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('Retrying', () => {
      it.effect('retries a rate limited request once', () =>
        Effect.gen(function* () {
          mockApiError(429, 'Rate limit exceeded');

          const error = yield* runWithClock(retryDelay);

          expect(error?.type).toBe('RATE_LIMIT');
          expect(mockedFetch).toHaveBeenCalledTimes(2);
        }),
      );

      it.effect('retries an overloaded model once', () =>
        Effect.gen(function* () {
          mockApiError(503, 'Model overloaded');

          const error = yield* runWithClock(retryDelay);

          expect(error?.type).toBe('MODEL_OVERLOADED');
          expect(mockedFetch).toHaveBeenCalledTimes(2);
        }),
      );

      it.effect('retries an unrecognised error shape and leaves the type undefined', () =>
        Effect.gen(function* () {
          mockedFetch.mockRejectedValue(new Error('boom'));

          const error = yield* runWithClock(retryDelay);

          expect(error).toBeInstanceOf(AiServiceError);
          expect(error?.type).toBeUndefined();
          expect(mockedFetch).toHaveBeenCalledTimes(2);
        }),
      );
    });

    describe('Timing out', () => {
      it.effect('fails with TIMEOUT when the response never arrives', () =>
        Effect.gen(function* () {
          mockedFetch.mockImplementation(() => new Promise(() => {}));

          const error = yield* runWithClock(requestTimeout, retryDelay, requestTimeout);

          expect(error).toBeInstanceOf(AiServiceError);
          expect(error?.type).toBe('TIMEOUT');
          expect(error?.message).toBe('Response generation timed out');
          expect(mockedFetch).toHaveBeenCalledTimes(2);
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

const requestTimeout = '2 minutes' satisfies Duration.Input;
const retryDelay = '10 seconds' satisfies Duration.Input;

function newService(): AiService {
  return new AiService(mockApiKey, mockModel);
}

function sendMessageEffect(): Effect.Effect<{ readonly summary: string }, AiServiceError> {
  return newService()
    .sendMessage(mockMessage, TestSchema)
    .pipe(Effect.provideService(FetchHttpClient.Fetch, mockedFetch));
}

function runWithClock(...durations: ReadonlyArray<Duration.Input>): Effect.Effect<AiServiceError | undefined> {
  return Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(Effect.result(sendMessageEffect()));

    for (const duration of durations) {
      yield* TestClock.adjust(duration);
    }

    const result = yield* Fiber.join(fiber);
    return Result.isFailure(result) ? result.failure : undefined;
  });
}

function sendMessage(): Promise<Result.Result<{ readonly summary: string }, AiServiceError>> {
  return Effect.runPromise(Effect.result(sendMessageEffect()));
}

async function sendMessageError(): Promise<AiServiceError | undefined> {
  const result = await sendMessage();
  return Result.isFailure(result) ? result.failure : undefined;
}

function requestBody(): Record<string, unknown> {
  const body = mockedFetch.mock.calls[0]?.[1]?.body as Uint8Array;
  return JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>;
}

function mockCompletion(content: string | null): void {
  mockedFetch.mockResolvedValue(
    jsonResponse(200, {
      choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
      usage: { total_tokens: 30, prompt_tokens: 10, completion_tokens: 20 },
    }),
  );
}

function mockApiError(status: number, message: string): void {
  mockedFetch.mockResolvedValue(jsonResponse(status, [{ error: { code: status, message, status: 'ERROR' } }]));
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
