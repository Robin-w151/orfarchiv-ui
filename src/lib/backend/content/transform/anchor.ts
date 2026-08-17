import { STORY_CONTENT_READ_MORE_REGEXPS } from '$lib/configs/server';
import { isOrfStoryUrl } from '$lib/utils/urls';
import { Context, Effect, Layer } from 'effect';

export class AnchorService extends Context.Service<AnchorService>()('AnchorService', {
  make: Effect.succeed({
    findReadMoreUrl,
    adjustAnchorTags,
    removeSiteAnchors,
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function findReadMoreUrl(originalDocument: Document) {
  return Effect.sync(() => {
    const paragraphs = [...originalDocument.querySelectorAll('p')];
    if (paragraphs.length > 4) {
      return null;
    }

    return paragraphs
      .filter((p) => {
        const text = p.textContent;
        if (!text) {
          return false;
        }
        if (!STORY_CONTENT_READ_MORE_REGEXPS.some((regexp) => regexp.test(text))) {
          return false;
        }

        const anchor = p.querySelector('a');
        return isOrfStoryUrl(anchor?.href);
      })
      .map((p) => p.querySelector('a')?.href ?? '')[0];
  });
}

function adjustAnchorTags(optimizedDocument: Document) {
  return Effect.sync(() => {
    for (const anchor of optimizedDocument.querySelectorAll('a')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  });
}

function removeSiteAnchors(optimizedDocument: Document) {
  return Effect.sync(() => {
    for (const anchor of optimizedDocument.querySelectorAll('a')) {
      if (new RegExp(/orf\.at.*#/i).exec(anchor.href)) {
        anchor.remove();
      }
    }
  });
}
