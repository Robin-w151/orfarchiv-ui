import { StoryContentErrorReason, StoryContentService } from '$common/storyContent/storyContent';
import { OptimizedContentIsEmptyError, ParseError } from '$lib/errors/errors';
import { logger } from '$lib/utils/logger';
import { Context, Effect, Layer } from 'effect';

export class ReadabilityService extends Context.Service<ReadabilityService>()('content/transform/ReadabilityService', {
  make: Effect.gen(function* () {
    const storyContentService = yield* StoryContentService;

    return defineService({ storyContentService });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(Layer.provide(StoryContentService.layer));
}

function defineService({
  storyContentService,
}: {
  storyContentService: Context.Service.Shape<typeof StoryContentService>;
}) {
  function optimizeContent(document: Document, url: string) {
    return storyContentService.extractArticle(document, url).pipe(
      Effect.mapError((error) => {
        if (error.reason === StoryContentErrorReason.Empty) {
          logger.warn(`Error transforming content with url='${url}'`);
          return new OptimizedContentIsEmptyError({ url, tags: [['url', url]], message: error.message });
        }

        return new ParseError({ url, tags: [['url', url]], cause: error.cause });
      }),
    );
  }

  return { optimizeContent };
}
