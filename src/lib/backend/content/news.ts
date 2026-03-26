import { searchStory } from '$lib/backend/db/news';
import { logger, STORY_CONTENT_READ_MORE_REGEXPS } from '$lib/configs/server';
import {
  ContentNotFoundError,
  FetchError,
  MetaDataNotFoundError,
  OptimizedContentIsEmptyError,
  ParseError,
  type FetchStoryContentError,
} from '$lib/errors/errors';
import { ChartData } from '$lib/models/charts';
import type { Story, StoryContent, StorySource } from '$lib/models/story';
import { isOrfStoryUrl } from '$lib/utils/urls';
import { Readability } from '@mozilla/readability';
import createDOMPurify, { type WindowLike } from 'dompurify';
import { Effect, Either, Predicate } from 'effect';
import { JSDOM } from 'jsdom';

const ALLOWED_CLASSES = ['fact', 'keyword', 'slideshow'];

export function fetchStoryContent(
  url: string,
  fetchReadMoreContent = false,
): Promise<Either.Either<StoryContent, FetchStoryContentError>> {
  const program = Effect.gen(function* () {
    logger.info(`Fetch content with url='${url}' and fetchReadMoreContent='${fetchReadMoreContent}'`);

    let currentUrl = url;
    let [currentStory, currentData] = yield* Effect.all([
      fetchStoryMetadata(currentUrl, true),
      fetchSiteHtmlText(currentUrl),
    ]);

    let id;
    let source;
    let originalDocument = createDom(currentData, currentUrl);

    if (fetchReadMoreContent) {
      const readMoreUrl = findReadMoreUrl(originalDocument);

      if (readMoreUrl) {
        logger.info(`Fetch content with readMore url='${readMoreUrl}'`);

        const result = yield* Effect.all([fetchStoryMetadata(readMoreUrl), fetchSiteHtmlText(readMoreUrl)]).pipe(
          Effect.either,
        );

        if (Either.isRight(result)) {
          const [story, data] = result.right;
          currentUrl = readMoreUrl;
          currentStory = story;
          currentData = data;
          id = story?.id;
          source = story?.source ?? findSourceFromUrl(currentUrl);
          originalDocument = createDom(currentData, currentUrl);
        } else {
          logger.warn(`Fetch content from readMore url not possible!`);
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
        message: `Optimized content from url='${currentUrl}' is empty`,
      });
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
  });

  return program.pipe(
    Effect.tapError((error) =>
      Effect.sync(() => logger.warn(`Failed to fetch content: url='${error.url}' error='${error}'`)),
    ),
    Effect.either,
    Effect.runPromise,
  );
}

function fetchStoryMetadata(
  url: string,
  includeOesterreichSource = false,
): Effect.Effect<Story, MetaDataNotFoundError> {
  return Effect.tryPromise({
    try: () => searchStory(url, { includeOesterreichSource }),
    catch: (cause) => new MetaDataNotFoundError({ url, cause }),
  }).pipe(Effect.filterOrFail(Predicate.isNotNullable, () => new MetaDataNotFoundError({ url })));
}

function fetchSiteHtmlText(url: string): Effect.Effect<string, FetchError | ParseError | ContentNotFoundError> {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (cause) => new FetchError({ url, cause }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return yield* new ContentNotFoundError({ url, message: `Content from url='${url}' cannot be loaded` });
      } else {
        return yield* new FetchError({ url });
      }
    }

    const text = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (cause) => new ParseError({ url, cause }),
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

function removeCharts(document: Document, url: string): Effect.Effect<void> {
  return Effect.gen(function* () {
    const charts = yield* Effect.all(
      [...document.querySelectorAll('div.embed.migsys')].map((chart) => {
        const dataMigUrl = chart.querySelector<HTMLDivElement>('div.migsys')?.dataset.migUrl;
        return Effect.all([Effect.succeed(chart), fetchChartData(dataMigUrl)]);
      }),
    );

    for (const [chart, data] of charts) {
      const placeholderAnchor = document.createElement('a');
      placeholderAnchor.href = url;
      placeholderAnchor.textContent = `Grafik zu „${data?.title?.trim() ?? 'unbekannt'}“`;
      chart.replaceWith(placeholderAnchor);
    }
  });
}

function fetchChartData(url: string | undefined): Effect.Effect<ChartData | undefined> {
  return Effect.gen(function* () {
    if (!url) {
      return undefined;
    }

    const response = yield* Effect.tryPromise({
      try: () => fetch(`${url}/config.json`),
      catch: (cause) => new FetchError({ url, cause }),
    });

    if (!response.ok) {
      return yield* new FetchError({ url });
    }

    const data = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) => new ParseError({ url, cause }),
    });

    const parsedData = ChartData.safeParse(data);
    return parsedData.data;
  }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
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

  for (const { columnIndex, colSpan, tableCell } of tableIterator(table)) {
    const columnsWithContent = new Array(colSpan)
      .fill(null)
      .reduce((count, _, i) => count + (columnHasContent[columnIndex + i] ? 1 : 0), 0);

    if (columnsWithContent === 0) {
      tableCell.remove();
    } else if (columnsWithContent < colSpan) {
      tableCell.colSpan = columnsWithContent;
    }
  }
}

function checkTableValidity(table: HTMLTableElement): { isValid: boolean; columnHasContent: Array<boolean> } {
  const tableColumns = calculateTableColumns(table);
  const tableRows = table.rows.length;
  if (tableColumns === 0 || tableRows === 0) {
    return { isValid: false, columnHasContent: [] };
  }

  const columnHasContent = new Array<boolean>(tableColumns).fill(false);
  let isValid = true;

  for (const { columnIndex, colSpan, tableCell } of tableIterator(table)) {
    if (columnIndex + colSpan - 1 < columnHasContent.length) {
      if (tableCell.innerHTML) {
        for (let i = 0; i < colSpan; i++) {
          columnHasContent[columnIndex + i] = true;
        }
      }
    } else {
      isValid = false;
    }
  }

  return { isValid, columnHasContent };
}

function calculateTableColumns(table: HTMLTableElement): number {
  const firstRow = table.rows[0];
  if (!firstRow) {
    return 0;
  }

  return ([...firstRow.children] as Array<HTMLTableCellElement>).reduce(
    (count, cell) => count + (cell.colSpan ?? 1),
    0,
  );
}

function* tableIterator(table: HTMLTableElement): Generator<{
  rowIndex: number;
  rowSpan: number;
  columnIndex: number;
  colSpan: number;
  tableCell: HTMLTableCellElement;
}> {
  const tableRows = table.rows.length;
  const rowSpanOffsetMap = new Map<number, Map<number, number>>(
    Array.from({ length: tableRows }, () => new Map()).map((rowMap, row) => [row, rowMap]),
  );

  for (const [tableRowIndex, tableRow] of [...table.rows].entries()) {
    let rowIndexOffset = 0;
    for (const [tableColumnIndex, tableCell] of [...tableRow.cells].entries()) {
      const colSpan = tableCell.colSpan ?? 1;
      const rowSpan = tableCell.rowSpan ?? 1;
      const additionalColumns = colSpan - 1;
      const adjustedColumnIndex = tableColumnIndex + rowIndexOffset;
      const additionalColumnsFromPreviousRowSpans =
        rowSpanOffsetMap
          .get(tableRowIndex)
          ?.entries()
          .filter(([c]) => c <= adjustedColumnIndex)
          .reduce((offset, [, span]) => offset + span, 0) ?? 0;
      const adjustedColumnIndexWithRowSpans = adjustedColumnIndex + additionalColumnsFromPreviousRowSpans;

      if (rowSpan > 1) {
        for (let i = 1; i < rowSpan; i++) {
          rowSpanOffsetMap.get(tableRowIndex + i)?.set(adjustedColumnIndexWithRowSpans, colSpan);
        }
      }

      yield {
        rowIndex: tableRowIndex,
        rowSpan,
        columnIndex: adjustedColumnIndexWithRowSpans,
        colSpan,
        tableCell,
      };

      rowIndexOffset += additionalColumns;
    }
  }
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
