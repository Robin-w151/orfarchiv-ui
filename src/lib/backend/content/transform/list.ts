import { Context, Effect, Layer } from 'effect';

export class ListService extends Context.Service<ListService>()('content/transform/ListService', {
  make: Effect.succeed({ adjustLists }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function adjustLists(optimizedDocument: Document) {
  return Effect.sync(() => {
    for (const li of optimizedDocument.querySelectorAll('li')) {
      if (!li.innerHTML) {
        li.remove();
      }
    }
  });
}
