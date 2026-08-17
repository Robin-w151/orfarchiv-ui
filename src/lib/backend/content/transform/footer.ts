import { Context, Effect, Layer } from 'effect';

export class FooterService extends Context.Service<FooterService>()('FooterService', {
  make: Effect.succeed({ injectStoryFooter }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function injectStoryFooter(optimizedDocument: Document, originalDocument: Document) {
  return Effect.sync(() => {
    const originalStoryFooter = originalDocument.querySelector('.story-footer');

    const storyFooterCandidates = optimizedDocument.querySelectorAll('div > div > p');
    for (const storyFooterCandidate of storyFooterCandidates) {
      if (storyFooterCandidate.textContent.trim() === originalStoryFooter?.textContent?.trim()) {
        storyFooterCandidate.remove();
      }
    }

    if (originalStoryFooter) {
      optimizedDocument.body.appendChild(originalStoryFooter);
    }
  });
}
