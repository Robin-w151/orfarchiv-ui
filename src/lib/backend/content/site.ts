import { Context, Effect, Layer } from 'effect';
import { FetchService, type FetchServiceShape } from './fetch';

export class SiteService extends Context.Service<SiteService>()('content/SiteService', {
  make: Effect.gen(function* () {
    const fetchService = yield* FetchService;

    return defineService({ fetchService });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(Layer.provide(FetchService.layer));
}

function defineService({ fetchService }: { fetchService: FetchServiceShape }) {
  function fetchSiteHtmlText(url: string) {
    return fetchService.fetchUrl(url, 'text');
  }

  return { fetchSiteHtmlText };
}
