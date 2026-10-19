import { StoryContentService } from '$common/storyContent/storyContent';
import { Context, Effect, Layer } from 'effect';

export class CleanupService extends Context.Service<CleanupService>()('content/transform/CleanupService', {
  make: Effect.gen(function* () {
    const storyContentService = yield* StoryContentService;

    return {
      removeArticleNoise: (document: Document) => storyContentService.removeArticleNoise(document),
      removeSiteNavigation,
    };
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(Layer.provide(StoryContentService.layer));
}

function removeSiteNavigation(optimizedDocument: Document) {
  return Effect.sync(() => {
    for (const navigation of optimizedDocument.querySelectorAll('nav')) {
      navigation.remove();
    }
  });
}
