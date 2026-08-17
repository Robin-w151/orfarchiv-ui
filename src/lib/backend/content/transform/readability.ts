import { OptimizedContentIsEmptyError } from '$lib/errors/errors';
import { logger } from '$lib/utils/logger';
import { Readability } from '@mozilla/readability';
import { Context, Effect, Layer } from 'effect';
import { DomService } from '../dom';

const ALLOWED_CLASSES = ['fact', 'image-container', 'image-credit-tag', 'keyword', 'slideshow'];

export class ReadabilityService extends Context.Service<ReadabilityService>()('ReadabilityService', {
  make: Effect.succeed({ optimizeContent }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(Layer.provide(DomService.layer));
}

function optimizeContent(document: Document, url: string) {
  return Effect.gen(function* () {
    const domService = yield* DomService;

    const optimizedContent = new Readability(document, { classesToPreserve: ALLOWED_CLASSES }).parse();
    if (!optimizedContent?.content) {
      logger.warn(`Error transforming content with url='${url}'`);
      return yield* new OptimizedContentIsEmptyError({
        url,
        tags: [['url', url]],
        message: `Optimized content from url='${url}' is empty`,
      });
    }

    return yield* domService.createDom(optimizedContent.content, url);
  });
}
