import { ParseError } from '$lib/errors/errors';
import { Context, Effect, Layer } from 'effect';
import { JSDOM } from 'jsdom';

export class DomService extends Context.Service<DomService>()('content/DomService', {
  make: Effect.succeed({ createDom }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function createDom(data: string, url: string) {
  return Effect.try({
    try: () => new JSDOM(data, { url }).window.document,
    catch: (cause) => new ParseError({ url, tags: [['url', url]], cause }),
  });
}
