import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import createDOMPurify, { type WindowLike } from 'dompurify';
import { ContentNotFoundError, OptimizedContentIsEmptyError } from '$lib/errors/errors';
import { isOrfStoryUrl } from '$lib/utils/urls';
import type { StoryContent, StorySource } from '$lib/models/story';
import { searchStory } from '$lib/backend/db/news';
import { logger, STORY_CONTENT_READ_MORE_REGEXPS } from '$lib/configs/server';

const ALLOWED_CLASSES = ['fact', 'keyword', 'slideshow'];

export async function fetchStoryContent(url: string, fetchReadMoreContent = false): Promise<StoryContent> {
  logger.info(`Fetch content with url='${url}' and fetchReadMoreContent='${fetchReadMoreContent}'`);

  let currentUrl = url;
  let [currentStory, currentData] = await Promise.all([
    searchStory(currentUrl, { includeOesterreichSource: true }),
    fetchSiteHtmlText(currentUrl),
  ]);
  let id;
  let source;
  let originalDocument = createDom(currentData, currentUrl);

  if (fetchReadMoreContent) {
    const readMoreUrl = findReadMoreUrl(originalDocument);

    if (readMoreUrl) {
      try {
        logger.info(`Fetch content with readMore url='${readMoreUrl}'`);
        const [story, data] = await Promise.all([searchStory(readMoreUrl), fetchSiteHtmlText(readMoreUrl)]);

        currentUrl = readMoreUrl;
        currentStory = story;
        currentData = data;
        id = story?.id;
        source = story?.source ?? findSourceFromUrl(currentUrl);
        originalDocument = createDom(currentData, currentUrl);
      } catch (error: unknown) {
        logger.warn(`${(error as Error).message}`);
      }
    }
  }

  const document = createDom(currentData, currentUrl);
  removePrintWarnings(document);
  removeVideo(document);
  removeMoreToReadSection(document);
  await removeCharts(document, currentUrl);
  const optimizedContent = new Readability(document, { classesToPreserve: ALLOWED_CLASSES }).parse();
  if (!optimizedContent?.content) {
    logger.warn(`Error transforming content with url='${currentUrl}'`);
    throw new OptimizedContentIsEmptyError(`Optimized content from url='${currentUrl}' is empty`);
  }

  const optimizedDocument = createDom(optimizedContent.content, currentUrl);
  removeSiteNavigation(optimizedDocument);
  removeSiteAnchors(optimizedDocument);
  injectSlideShowImages(optimizedDocument, originalDocument);
  injectStoryFooter(optimizedDocument, originalDocument);
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
}

async function fetchSiteHtmlText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ContentNotFoundError(`Content from url='${url}' cannot be loaded`);
  }
  return response.text();
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

async function removeCharts(document: Document, url: string): Promise<void> {
  const charts: Array<[Element, any]> = await Promise.all(
    [...document.querySelectorAll('div.embed.migsys')].map((chart) => {
      const dataMigUrl = chart.querySelector<HTMLDivElement>('div.migsys')?.dataset.migUrl;
      return (async () => {
        if (!dataMigUrl) {
          return [chart, undefined];
        }

        try {
          const response = await fetch(`${dataMigUrl}/config.json`);
          if (!response.ok) {
            return [chart, undefined];
          }

          const data = await response.json();
          return [chart, data];
        } catch (error: unknown) {
          logger.warn(`Error fetching chart data from url='${dataMigUrl}/config.json'. Error: ${error}`);
          return [chart, undefined];
        }
      })();
    }),
  );

  for (const [chart, data] of charts) {
    const placeholderAnchor = document.createElement('a');
    placeholderAnchor.href = url;
    placeholderAnchor.textContent = `Grafik zu „${data?.title?.trim() ?? 'unbekannt'}“`;

    chart.replaceWith(placeholderAnchor);
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

function injectSlideShowImages(optimizedDocument: Document, originalDocument: Document): void {
  const slideShowRegexp = /^fotostrecke mit/i;
  const slideShowElements = [...originalDocument.querySelectorAll('.oon-slideshow')] as Array<HTMLElement>;
  const slideShowHeaders = [...optimizedDocument.querySelectorAll('h3')].filter((header) =>
    slideShowRegexp.test(header.textContent ?? ''),
  );

  if (slideShowElements.length !== slideShowHeaders.length) {
    return;
  }

  for (let i = 0; i < slideShowElements.length; i++) {
    const slideShowSection = slideShowElements[i];
    const slideShowHeader = slideShowHeaders[i];

    if (slideShowHeader.parentElement?.querySelector('h3 + div')) {
      continue;
    }

    const slideShowList = slideShowSection.querySelector('.oon-slideshow-list');
    slideShowList?.removeAttribute('class');
    slideShowList?.setAttribute('class', 'slideshow');

    const footers = [...slideShowSection.querySelectorAll('figure > footer')];
    for (const footer of footers) {
      footer.remove();
    }

    const images = [...slideShowSection.querySelectorAll('img')];
    for (const image of images) {
      image.src = image.dataset.src ?? '';
      image.srcset = image.dataset.srcset ?? '';
      image.removeAttribute('class');
      image.setAttribute('loading', 'lazy');
    }

    if (slideShowList) {
      slideShowHeader.after(slideShowList);
    }
  }
}

function injectStoryFooter(optimizedDocument: Document, originalDocument: Document): void {
  const storyFooter = originalDocument.querySelector('.story-footer');
  if (storyFooter) {
    optimizedDocument.body.appendChild(storyFooter);
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

function adjustTables(optimizedDocument: Document): void {
  for (const table of optimizedDocument.querySelectorAll('table')) {
    adjustTable(table);
  }
}

function adjustTable(table: HTMLTableElement): void {
  const { isValid, columnHasContent } = checkTableValidity(table);
  if (!isValid) {
    table.remove();
    return;
  }

  for (const tableRow of table.rows) {
    for (const [index, tableCell] of [...tableRow.cells].entries()) {
      if (!columnHasContent[index]) {
        tableCell.remove();
      }
    }
  }
}

function checkTableValidity(table: HTMLTableElement): { isValid: boolean; columnHasContent: Array<boolean> } {
  const tableColumns = table.tHead?.rows[0]?.cells.length ?? 0;
  if (tableColumns === 0) {
    return { isValid: false, columnHasContent: [] };
  }

  const columnHasContent: Array<boolean> = new Array(tableColumns).fill(false);
  let isValid = true;

  for (const tableRow of table.rows) {
    for (const [index, tableCell] of [...tableRow.children].entries()) {
      if (index < columnHasContent.length) {
        if (tableCell.innerHTML) {
          columnHasContent[index] = true;
        }
      } else {
        isValid = false;
      }
    }
  }

  return { isValid, columnHasContent };
}

function sanitizeContent(html: string): string {
  const DOMPurify = createDOMPurify(new JSDOM('').window as unknown as WindowLike);
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    FORBID_ATTR: ['tabindex'],
  });
}

function extractTextForSpeechSynthesis(optimizedDocument: Document, originalDocument: Document): string {
  const unwantetPatterns = [/^\d+\s*\.\s+[a-zäöü]+\s+\d+,\s+\d+\.\d+\s+uhr(\s*\(update.*\))?$/i, /^online\s+seit/i];
  const keywordText = originalDocument.querySelector('div.keyword')?.textContent?.trim();
  if (keywordText) {
    unwantetPatterns.push(new RegExp(`^${keywordText}$`));
  }

  const document = optimizedDocument.cloneNode(true) as Document;
  for (const element of document.querySelectorAll('p')) {
    const text = element.textContent?.trim() ?? '';
    if (unwantetPatterns.some((pattern) => pattern.test(text))) {
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
}
