import { logger } from '$lib/configs/server';
import { FetchTimeoutError, formatTags, type FetchStoryContentError } from '$lib/errors/errors';
import type { StoryContent, StorySource } from '$lib/models/story';
import { Effect, Layer, Result } from 'effect';
import { DomService } from './dom';
import { MetaDataService } from './metadata';
import { SiteService } from './site';
import { AnchorService } from './transform/anchor';
import { ChartService } from './transform/chart';
import { CleanupService } from './transform/cleanup';
import { FooterService } from './transform/footer';
import { ImageService } from './transform/image';
import { ListService } from './transform/list';
import { ReadabilityService } from './transform/readability';
import { SanitizeService } from './transform/sanitize';
import { SpeechService } from './transform/speech';
import { TableService } from './transform/table';

const ContentLive = Layer.mergeAll(
  AnchorService.layer,
  ChartService.layer,
  CleanupService.layer,
  DomService.layer,
  FooterService.layer,
  ImageService.layer,
  ListService.layer,
  MetaDataService.layer,
  ReadabilityService.layer,
  SanitizeService.layer,
  SiteService.layer,
  SpeechService.layer,
  TableService.layer,
);

export function fetchStoryContent(
  url: string,
  fetchReadMoreContent = false,
): Promise<Result.Result<StoryContent, FetchStoryContentError>> {
  const program = Effect.gen(function* () {
    const anchorService = yield* AnchorService;
    const chartService = yield* ChartService;
    const cleanupService = yield* CleanupService;
    const domService = yield* DomService;
    const footerService = yield* FooterService;
    const imageService = yield* ImageService;
    const listService = yield* ListService;
    const metaDataService = yield* MetaDataService;
    const readabilityService = yield* ReadabilityService;
    const sanitizeService = yield* SanitizeService;
    const siteService = yield* SiteService;
    const speechService = yield* SpeechService;
    const tableService = yield* TableService;

    logger.info(`Fetch content with url='${url}' and fetchReadMoreContent='${fetchReadMoreContent}'`);

    let currentUrl = url;
    let [currentStory, currentData] = yield* Effect.all([
      metaDataService.fetchStoryMetadata(currentUrl, true),
      siteService.fetchSiteHtmlText(currentUrl),
    ]);

    let id: string | undefined = undefined;
    let source: string | undefined = undefined;
    let originalDocument = yield* domService.createDom(currentData, currentUrl);

    if (fetchReadMoreContent) {
      const readMoreUrl = yield* anchorService.findReadMoreUrl(originalDocument);

      if (readMoreUrl) {
        logger.info(`Fetch content with readMore url='${readMoreUrl}'`);

        const result = yield* Effect.all(
          [metaDataService.fetchStoryMetadata(readMoreUrl), siteService.fetchSiteHtmlText(readMoreUrl)],
          { concurrency: 'unbounded' },
        ).pipe(Effect.result);

        if (Result.isSuccess(result)) {
          const [story, data] = result.success;
          currentUrl = readMoreUrl;
          currentStory = story;
          currentData = data;
          id = story?.id;
          source = story?.source ?? (yield* metaDataService.findSourceFromUrl(currentUrl));
          originalDocument = yield* domService.createDom(currentData, currentUrl);
        } else {
          logger.warn(`Failed to fetch content from readMore url: ${formatTags(result.failure.tags)}`);
        }
      }
    }

    const document = yield* domService.createDom(currentData, currentUrl);
    yield* cleanupService.removePrintWarnings(document);
    yield* cleanupService.removeVideo(document);
    yield* cleanupService.removeMoreToReadSection(document);
    yield* chartService.removeCharts(document, currentUrl);

    const optimizedDocument = yield* readabilityService.optimizeContent(document, currentUrl);
    yield* cleanupService.removeSiteNavigation(optimizedDocument);
    yield* anchorService.removeSiteAnchors(optimizedDocument);
    yield* imageService.injectSlideShowImages(optimizedDocument, originalDocument);
    yield* footerService.injectStoryFooter(optimizedDocument, originalDocument);
    yield* imageService.adjustImages(optimizedDocument, originalDocument);
    yield* anchorService.adjustAnchorTags(optimizedDocument);
    yield* listService.adjustLists(optimizedDocument);
    yield* tableService.adjustTables(optimizedDocument);

    const storySource = source ? ({ name: source, url: currentUrl } satisfies StorySource) : undefined;

    return {
      content: yield* sanitizeService.sanitizeContent(optimizedDocument.body.innerHTML),
      contentText: yield* speechService.extractTextForSpeechSynthesis(optimizedDocument, originalDocument),
      id,
      timestamp: currentStory?.timestamp,
      source: storySource,
    };
  });

  return program.pipe(
    Effect.provide(ContentLive),
    Effect.timeout('1 minute'),
    Effect.catchTag('TimeoutError', (cause) =>
      Effect.fail(new FetchTimeoutError({ url, tags: [['url', url]], cause })),
    ),
    Effect.tapError((error) => Effect.sync(() => logger.warn(`Failed to fetch content: ${formatTags(error.tags)}`))),
    Effect.result,
    Effect.runPromise,
  );
}
