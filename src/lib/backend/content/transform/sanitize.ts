import createDOMPurify, { type WindowLike } from 'dompurify';
import { Context, Effect, Layer } from 'effect';
import { JSDOM } from 'jsdom';

const VUE_SCOPE_ATTRIBUTE_REGEXP = /data-v-\w+/;

export class SanitizeService extends Context.Service<SanitizeService>()('content/transform/SanitizeService', {
  make: Effect.succeed({ sanitizeContent }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function sanitizeContent(html: string) {
  return Effect.sync(() => {
    const DOMPurify = createDOMPurify(new JSDOM('').window as unknown as WindowLike);
    DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
      if (VUE_SCOPE_ATTRIBUTE_REGEXP.test(data.attrName)) {
        data.keepAttr = false;
      }
    });

    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target'],
      FORBID_ATTR: ['tabindex'],
    });
  });
}
