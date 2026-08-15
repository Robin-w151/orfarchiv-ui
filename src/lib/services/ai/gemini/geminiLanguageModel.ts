import { AI_MODEL_CONFIG_MAP } from '$lib/configs/client';
import type { AiModel } from '$lib/models/ai';
import { Effect, Layer, Option, Schema, Stream } from 'effect';
import {
  AiError,
  LanguageModel,
  OpenAiStructuredOutput,
  type Prompt,
  type Response as AiResponse,
} from 'effect/unstable/ai';
import {
  HttpBody,
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from 'effect/unstable/http';

const MODULE = 'GeminiLanguageModel';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const TEXT_PART_ID = 'text';
const INVALID_API_KEY_MESSAGE = 'Please pass a valid API key';

const ChatCompletion = Schema.Struct({
  choices: Schema.Array(
    Schema.Struct({
      finish_reason: Schema.optional(Schema.NullOr(Schema.String)),
      message: Schema.Struct({
        content: Schema.optional(Schema.NullOr(Schema.String)),
      }),
    }),
  ),
  usage: Schema.optional(
    Schema.NullOr(
      Schema.Struct({
        prompt_tokens: Schema.optional(Schema.Number),
        completion_tokens: Schema.optional(Schema.Number),
        total_tokens: Schema.optional(Schema.Number),
      }),
    ),
  ),
});
type ChatCompletion = typeof ChatCompletion.Type;

const ErrorEnvelope = Schema.Struct({
  error: Schema.Struct({
    message: Schema.optional(Schema.String),
  }),
});
const ErrorBody = Schema.Union([Schema.Array(ErrorEnvelope), ErrorEnvelope]);

export interface GeminiLanguageModelOptions {
  readonly apiKey: string;
  readonly model: AiModel;
}

interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

interface ResponseFormat {
  readonly type: 'json_schema';
  readonly json_schema: {
    readonly name: string;
    readonly strict: true;
    readonly schema: unknown;
  };
}

export function layer(
  options: GeminiLanguageModelOptions,
): Layer.Layer<LanguageModel.LanguageModel, never, HttpClient.HttpClient> {
  return Layer.effect(LanguageModel.LanguageModel, make(options));
}

export const make = Effect.fnUntraced(function* (options: GeminiLanguageModelOptions) {
  const modelConfig = AI_MODEL_CONFIG_MAP[options.model];
  const httpClient = (yield* HttpClient.HttpClient).pipe(
    HttpClient.mapRequest((request) =>
      request.pipe(
        HttpClientRequest.prependUrl(BASE_URL),
        HttpClientRequest.bearerToken(options.apiKey),
        HttpClientRequest.acceptJson,
      ),
    ),
  );

  const generateText = Effect.fnUntraced(function* (providerOptions: LanguageModel.ProviderOptions) {
    const messages = yield* toMessages(providerOptions.prompt);
    const responseFormat = yield* toResponseFormat(providerOptions.responseFormat);

    const response = yield* httpClient
      .execute(
        HttpClientRequest.post('/chat/completions', {
          body: HttpBody.jsonUnsafe({
            model: modelConfig.modelCode,
            messages,
            reasoning_effort: modelConfig.reasoningEffort,
            ...(responseFormat ? { response_format: responseFormat } : {}),
          }),
        }),
      )
      .pipe(
        Effect.provideService(HttpClient.TracerPropagationEnabled, false),
        Effect.mapError((error) => makeError(toTransportReason(error))),
      );

    if (response.status < 200 || response.status >= 300) {
      return yield* failWithStatus(response);
    }

    const completion = yield* HttpClientResponse.schemaBodyJson(ChatCompletion)(response).pipe(
      Effect.mapError((error) => makeError(new AiError.InvalidOutputError({ description: error.message }))),
    );

    return toParts(completion);
  });

  const streamText = (
    providerOptions: LanguageModel.ProviderOptions,
  ): Stream.Stream<AiResponse.StreamPartEncoded, AiError.AiError> =>
    Stream.unwrap(Effect.map(generateText(providerOptions), (parts) => Stream.fromArray(toStreamParts(parts))));

  return yield* LanguageModel.make({
    codecTransformer: OpenAiStructuredOutput.toCodecOpenAI,
    generateText,
    streamText,
  });
});

function toMessages(prompt: Prompt.Prompt): Effect.Effect<Array<ChatMessage>, AiError.AiError> {
  return Effect.forEach(prompt.content, toMessage);
}

function toMessage(message: Prompt.Message): Effect.Effect<ChatMessage, AiError.AiError> {
  switch (message.role) {
    case 'system': {
      return Effect.succeed({ role: 'system', content: message.content });
    }
    case 'user':
    case 'assistant': {
      const unsupported = message.content.find((part) => part.type !== 'text');
      if (unsupported) {
        return Effect.fail(
          makeError(
            new AiError.InvalidUserInputError({
              description: `Content of type '${unsupported.type}' is not supported by the Gemini OpenAI compatible endpoint`,
            }),
          ),
        );
      }

      const content = message.content.map((part) => (part.type === 'text' ? part.text : '')).join('');
      return Effect.succeed({ role: message.role, content });
    }
    default: {
      return Effect.fail(
        makeError(
          new AiError.InvalidUserInputError({
            description: `Messages of role '${message.role}' are not supported by the Gemini OpenAI compatible endpoint`,
          }),
        ),
      );
    }
  }
}

function toResponseFormat(
  responseFormat: LanguageModel.ProviderOptions['responseFormat'],
): Effect.Effect<ResponseFormat | undefined, AiError.AiError> {
  if (responseFormat.type !== 'json') {
    return Effect.succeed(undefined);
  }

  return Effect.try({
    try: () => OpenAiStructuredOutput.toCodecOpenAI(responseFormat.schema),
    catch: (error) =>
      makeError(
        new AiError.UnsupportedSchemaError({
          description: error instanceof Error ? error.message : String(error),
        }),
      ),
  }).pipe(
    Effect.map(({ jsonSchema }) => ({
      type: 'json_schema' as const,
      json_schema: { name: responseFormat.objectName, strict: true as const, schema: jsonSchema },
    })),
  );
}

function toParts(completion: ChatCompletion): Array<AiResponse.PartEncoded> {
  const choice = completion.choices[0];
  const parts: Array<AiResponse.PartEncoded> = [];

  const text = choice?.message.content;
  if (text) {
    parts.push({ type: 'text', text });
  }

  parts.push({
    type: 'finish',
    reason: toFinishReason(choice?.finish_reason),
    usage: {
      inputTokens: { total: completion.usage?.prompt_tokens },
      outputTokens: { total: completion.usage?.completion_tokens },
    },
  });

  return parts;
}

function toFinishReason(finishReason: string | null | undefined): AiResponse.FinishReason {
  switch (finishReason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'content_filter':
      return 'content-filter';
    case 'tool_calls':
      return 'tool-calls';
    case null:
    case undefined:
      return 'unknown';
    default:
      return 'other';
  }
}

function toStreamParts(parts: ReadonlyArray<AiResponse.PartEncoded>): Array<AiResponse.StreamPartEncoded> {
  return parts.flatMap((part) => {
    if (part.type !== 'text') {
      return [part as AiResponse.StreamPartEncoded];
    }

    return [
      { type: 'text-start', id: TEXT_PART_ID },
      { type: 'text-delta', id: TEXT_PART_ID, delta: part.text },
      { type: 'text-end', id: TEXT_PART_ID },
    ];
  });
}

function failWithStatus(response: HttpClientResponse.HttpClientResponse): Effect.Effect<never, AiError.AiError> {
  return Effect.gen(function* () {
    const body = yield* Effect.orElseSucceed(response.text, () => '');
    const message = errorMessage(body);
    const description = message ?? `Request failed with status ${response.status}`;
    const http = toHttpContext(response);

    switch (response.status) {
      case 400:
      case 404: {
        if (message === INVALID_API_KEY_MESSAGE) {
          return yield* Effect.fail(makeError(new AiError.AuthenticationError({ kind: 'InvalidKey', http })));
        }
        return yield* Effect.fail(makeError(new AiError.InvalidRequestError({ description, http })));
      }
      case 401:
      case 403: {
        return yield* Effect.fail(makeError(new AiError.AuthenticationError({ kind: 'InvalidKey', http })));
      }
      case 429: {
        return yield* Effect.fail(makeError(new AiError.RateLimitError({ http })));
      }
      default: {
        return yield* Effect.fail(makeError(new AiError.InternalProviderError({ description, http })));
      }
    }
  });
}

function toHttpContext(response: HttpClientResponse.HttpClientResponse): typeof AiError.HttpContext.Type {
  return {
    request: {
      method: response.request.method,
      url: response.request.url,
      urlParams: [...response.request.urlParams],
      headers: {},
    },
    response: {
      status: response.status,
      headers: {},
    },
  };
}

function errorMessage(body: string): string | undefined {
  const json = jsonOrUndefined(body);
  if (json === undefined) {
    return undefined;
  }

  const decoded = Schema.decodeUnknownOption(ErrorBody)(json);
  if (Option.isNone(decoded)) {
    return undefined;
  }

  const envelope = Array.isArray(decoded.value) ? decoded.value[0] : decoded.value;
  return envelope?.error.message;
}

function jsonOrUndefined(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function toTransportReason(error: HttpClientError.HttpClientError): AiError.AiErrorReason {
  switch (error.reason._tag) {
    case 'TransportError':
    case 'EncodeError':
    case 'InvalidUrlError': {
      return AiError.NetworkError.fromRequestError(error.reason);
    }
    default: {
      return new AiError.InternalProviderError({ description: error.message });
    }
  }
}

function makeError(reason: AiError.AiErrorReason): AiError.AiError {
  return AiError.make({ module: MODULE, method: 'generateText', reason });
}
