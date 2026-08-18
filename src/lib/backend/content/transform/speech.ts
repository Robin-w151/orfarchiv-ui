import { Context, Effect, Layer } from 'effect';

export class SpeechService extends Context.Service<SpeechService>()('content/transform/SpeechService', {
  make: Effect.succeed({ extractTextForSpeechSynthesis }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function extractTextForSpeechSynthesis(optimizedDocument: Document, originalDocument: Document) {
  return Effect.sync(() => {
    const unwantetPatterns = [/^\d+\s*\.\s+[a-zäöü]+\s+\d+,\s+\d+\.\d+\s+uhr(\s*\(update.*\))?$/i, /^online\s+seit/i];
    const keywordText = originalDocument.querySelector('div.keyword')?.textContent?.trim();

    const document = optimizedDocument.cloneNode(true) as Document;
    for (const element of document.querySelectorAll('p')) {
      const text = element.textContent?.trim() ?? '';
      const isKeyword = keywordText ? text === keywordText : false;
      if (isKeyword || unwantetPatterns.some((pattern) => pattern.test(text))) {
        element.remove();
      }
    }

    for (const element of document.querySelectorAll('.slideshow')) {
      element.parentElement?.remove();
    }

    for (const element of document.querySelectorAll('figcaption')) {
      element.remove();
    }

    for (const element of document.querySelectorAll('.story-footer')) {
      element.remove();
    }

    for (const header of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      const text = header.textContent?.trim() ?? '';
      if (text && !text.endsWith('.')) {
        header.textContent = `${text}.`;
      }
    }

    return document.body.textContent?.replaceAll(/\s+/g, ' ')?.trim() ?? '';
  });
}
