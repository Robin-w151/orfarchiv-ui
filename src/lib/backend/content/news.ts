import { searchStory } from '$lib/backend/db/news';
import { logger, STORY_CONTENT_READ_MORE_REGEXPS } from '$lib/configs/server';
import {
  ContentNotFoundError,
  FetchError,
  formatTags,
  MetaDataNotFoundError,
  OptimizedContentIsEmptyError,
  ParseError,
  type FetchStoryContentError,
} from '$lib/errors/errors';
import type { Story, StoryContent, StorySource } from '$lib/models/story';
import { isOrfStoryUrl } from '$lib/utils/urls';
import { Readability } from '@mozilla/readability';
import createDOMPurify, { type WindowLike } from 'dompurify';
import { Effect, Predicate, Result } from 'effect';
import { JSDOM } from 'jsdom';
import { removeCharts } from './transform/chart';
import { adjustImages, injectSlideShowImages } from './transform/image';
import { extractTextForSpeechSynthesis } from './transform/speech';
import { adjustTables } from './transform/table';

const ALLOWED_CLASSES = ['fact', 'image-container', 'image-credit-tag', 'keyword', 'slideshow'];
const VUE_SCOPE_ATTRIBUTE_REGEXP = /data-v-\w+/;

export function fetchStoryContent(
  url: string,
  fetchReadMoreContent = false,
): Promise<Result.Result<StoryContent, FetchStoryContentError>> {
  const program = Effect.gen(function* () {
    logger.info(`Fetch content with url='${url}' and fetchReadMoreContent='${fetchReadMoreContent}'`);

    let currentUrl = url;
    let [currentStory, currentData] = yield* Effect.all([
      fetchStoryMetadata(currentUrl, true),
      fetchSiteHtmlText(currentUrl),
    ]);

    let id: string | undefined = undefined;
    let source: string | undefined = undefined;
    let originalDocument = createDom(currentData, currentUrl);

    if (fetchReadMoreContent) {
      const readMoreUrl = findReadMoreUrl(originalDocument);

      if (readMoreUrl) {
        logger.info(`Fetch content with readMore url='${readMoreUrl}'`);

        const result = yield* Effect.all([fetchStoryMetadata(readMoreUrl), fetchSiteHtmlText(readMoreUrl)]).pipe(
          Effect.result,
        );

        if (Result.isSuccess(result)) {
          const [story, data] = result.success;
          currentUrl = readMoreUrl;
          currentStory = story;
          currentData = data;
          id = story?.id;
          source = story?.source ?? findSourceFromUrl(currentUrl);
          originalDocument = createDom(currentData, currentUrl);
        } else {
          logger.warn(`Failed to fetch content from readMore url: ${formatTags(result.failure.tags)}`);
        }
      }
    }

    const document = createDom(currentData, currentUrl);
    removePrintWarnings(document);
    removeVideo(document);
    removeMoreToReadSection(document);
    yield* removeCharts(document, currentUrl);
    const optimizedContent = new Readability(document, { classesToPreserve: ALLOWED_CLASSES }).parse();
    if (!optimizedContent?.content) {
      logger.warn(`Error transforming content with url='${currentUrl}'`);
      return yield* new OptimizedContentIsEmptyError({
        url: currentUrl,
        tags: [['url', currentUrl]],
        message: `Optimized content from url='${currentUrl}' is empty`,
      });
    }

    const optimizedDocument = createDom(optimizedContent.content, currentUrl);
    removeSiteNavigation(optimizedDocument);
    removeSiteAnchors(optimizedDocument);
    injectSlideShowImages(optimizedDocument, originalDocument);
    injectStoryFooter(optimizedDocument, originalDocument);
    adjustImages(optimizedDocument, originalDocument);
    adjustAnchorTags(optimizedDocument);
    adjustLists(optimizedDocument);
    adjustTables(optimizedDocument);

    const storySource = source ? ({ name: source, url: currentUrl } satisfies StorySource) : undefined;

    return {
      content: sanitizeContent(optimizedDocument.body.innerHTML),
      contentText: extractTextForSpeechSynthesis(optimizedDocument, originalDocument),
      id,
      timestamp: currentStory?.timestamp,
      source: storySource,
    };
  });

  return program.pipe(
    Effect.tapError((error) => Effect.sync(() => logger.warn(`Failed to fetch content: ${formatTags(error.tags)}`))),
    Effect.result,
    Effect.runPromise,
  );
}

function fetchStoryMetadata(
  url: string,
  includeOesterreichSource = false,
): Effect.Effect<Story, MetaDataNotFoundError> {
  return Effect.tryPromise({
    try: () => searchStory(url, { includeOesterreichSource }),
    catch: (cause) =>
      new MetaDataNotFoundError({
        url,
        tags: [
          ['url', url],
          ['cause', (cause as Error).message],
        ],
        cause,
      }),
  }).pipe(Effect.filterOrFail(Predicate.isNotNullish, () => new MetaDataNotFoundError({ url, tags: [['url', url]] })));
}

function fetchSiteHtmlText(url: string): Effect.Effect<string, FetchError | ParseError | ContentNotFoundError> {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (cause) =>
        new FetchError({
          url,
          tags: [
            ['url', url],
            ['cause', (cause as Error).message],
          ],
          cause,
        }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return yield* new ContentNotFoundError({
          url,
          tags: [
            ['url', url],
            ['status', response.status.toString()],
          ],
          message: `Content from url='${url}' cannot be loaded`,
        });
      } else {
        return yield* new FetchError({
          url,
          tags: [
            ['url', url],
            ['status', response.status.toString()],
          ],
        });
      }
    }

    const text = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (cause) => new ParseError({ url, tags: [['url', url]], cause }),
    });

    return text;
  });
}

function createDom(data: string, url: string): Document {
  return new JSDOM(data, { url }).window.document;
}

function findReadMoreUrl(originalDocument: Document): string | null {
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
}

function findSourceFromUrl(url: string): string | undefined {
  return /^https:\/\/(?<source>\w+)\.orf\.at/i.exec(url)?.groups?.source;
}

function removePrintWarnings(document: Document): void {
  for (const element of document.querySelectorAll('.print-warning')) {
    element.remove();
  }
}

function removeVideo(document: Document): void {
  for (const stripeCredits of document.querySelectorAll('p.caption.stripe-credits')) {
    stripeCredits.remove();
  }

  for (const stripe of document.querySelectorAll('section.stripe')) {
    stripe.remove();
  }
}

function removeMoreToReadSection(document: Document): void {
  for (const element of document.querySelectorAll('#more-to-read')) {
    element.remove();
  }
}

function removeSiteNavigation(optimizedDocument: Document): void {
  for (const navigation of optimizedDocument.querySelectorAll('nav')) {
    navigation.remove();
  }
}

function removeSiteAnchors(optimizedDocument: Document): void {
  for (const anchor of optimizedDocument.querySelectorAll('a')) {
    if (new RegExp(/orf\.at.*#/i).exec(anchor.href)) {
      anchor.remove();
    }
  }
}

function injectStoryFooter(optimizedDocument: Document, originalDocument: Document): void {
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
}

function adjustAnchorTags(optimizedDocument: Document): void {
  for (const anchor of optimizedDocument.querySelectorAll('a')) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
}

function adjustLists(optimizedDocument: Document): void {
  for (const li of optimizedDocument.querySelectorAll('li')) {
    if (!li.innerHTML) {
      li.remove();
    }
  }
}

function sanitizeContent(html: string): string {
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
}
