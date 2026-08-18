import { ContentNotFoundError, FetchError, type Tag, type Tags } from '$lib/errors/errors';
import { Context, Effect, Layer } from 'effect';
import { FetchHttpClient, HttpClient, HttpClientError, HttpClientResponse } from 'effect/unstable/http';

const responseBodies = {
  json: (response: HttpClientResponse.HttpClientResponse) => response.json,
  text: (response: HttpClientResponse.HttpClientResponse) => response.text,
} as const;

export type ContentType = keyof typeof responseBodies;
export type Content<TContentType extends ContentType> = Effect.Success<
  ReturnType<(typeof responseBodies)[TContentType]>
>;

export type FetchServiceShape = Context.Service.Shape<typeof FetchService>;
export class FetchService extends Context.Service<FetchService>()('content/FetchService', {
  make: Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;

    return defineService({ httpClient });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(Layer.provide(FetchHttpClient.layer));
}

function defineService({ httpClient }: { httpClient: HttpClient.HttpClient }) {
  function fetchUrl<TContentType extends ContentType>(
    url: string,
    contentType: TContentType,
  ): Effect.Effect<Content<TContentType>, ContentNotFoundError | FetchError> {
    return httpClient.get(url).pipe(
      Effect.andThen(HttpClientResponse.filterStatusOk),
      Effect.andThen(
        (response) =>
          responseBodies[contentType](response) as Effect.Effect<
            Content<TContentType>,
            HttpClientError.HttpClientError
          >,
      ),
      Effect.mapError((cause) => toFetchError(url, cause)),
    );
  }

  return { fetchUrl } as const;
}

function toFetchError(url: string, cause: HttpClientError.HttpClientError): ContentNotFoundError | FetchError {
  const status = cause.response?.status;
  const tags: Tags = [
    ['url', url],
    ['status', status?.toString()],
  ].filter((tag): tag is Tag => tag[1] !== undefined);

  if (status === 404) {
    return new ContentNotFoundError({ url, tags, message: `Content from url='${url}' cannot be loaded` });
  } else {
    return new FetchError({ url, tags, cause });
  }
}
