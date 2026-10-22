import { StoryContentService } from '#common/storyContent/storyContent.ts';
import { ParseError } from '#lib/errors/errors.ts';
import { Context, Effect, Layer } from 'effect';

export class DomService extends Context.Service<DomService>()('content/DomService', {
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
  function createDom(data: string, url: string) {
    return storyContentService
      .createStoryDocument(data, url)
      .pipe(Effect.mapError(({ cause }) => new ParseError({ url, tags: [['url', url]], cause })));
  }

  return { createDom };
}
