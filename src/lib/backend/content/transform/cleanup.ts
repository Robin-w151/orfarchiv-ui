import { Context, Effect, Layer } from 'effect';

export class CleanupService extends Context.Service<CleanupService>()('CleanupService', {
  make: Effect.succeed({
    removePrintWarnings,
    removeVideo,
    removeMoreToReadSection,
    removeSiteNavigation,
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function removePrintWarnings(document: Document) {
  return Effect.sync(() => {
    for (const element of document.querySelectorAll('.print-warning')) {
      element.remove();
    }
  });
}

function removeVideo(document: Document) {
  return Effect.sync(() => {
    for (const stripeCredits of document.querySelectorAll('p.caption.stripe-credits')) {
      stripeCredits.remove();
    }

    for (const stripe of document.querySelectorAll('section.stripe')) {
      stripe.remove();
    }
  });
}

function removeMoreToReadSection(document: Document) {
  return Effect.sync(() => {
    for (const element of document.querySelectorAll('#more-to-read')) {
      element.remove();
    }
  });
}

function removeSiteNavigation(optimizedDocument: Document) {
  return Effect.sync(() => {
    for (const navigation of optimizedDocument.querySelectorAll('nav')) {
      navigation.remove();
    }
  });
}
