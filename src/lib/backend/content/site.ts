import { ContentNotFoundError, FetchError, ParseError } from '$lib/errors/errors';
import { Context, Effect, Layer } from 'effect';

export class SiteService extends Context.Service<SiteService>()('content/SiteService', {
  make: Effect.succeed({ fetchSiteHtmlText }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function fetchSiteHtmlText(url: string) {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (cause) =>
        new FetchError({
          url,
          tags: [
            ['url', url],
            ['cause', (cause as Error).message],
          ],
          cause,
        }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return yield* new ContentNotFoundError({
          url,
          tags: [
            ['url', url],
            ['status', response.status.toString()],
          ],
          message: `Content from url='${url}' cannot be loaded`,
        });
      } else {
        return yield* new FetchError({
          url,
          tags: [
            ['url', url],
            ['status', response.status.toString()],
          ],
        });
      }
    }

    const text = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (cause) => new ParseError({ url, tags: [['url', url]], cause }),
    });

    return text;
  });
}
