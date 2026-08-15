import { FetchError, formatTags, ParseError } from '$lib/errors/errors';
import { ChartData } from '$lib/models/charts';
import { logger } from '$lib/utils/logger';
import { Effect, Schema } from 'effect';

export function removeCharts(document: Document, url: string): Effect.Effect<void> {
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
      return yield* new FetchError({
        url,
        tags: [
          ['url', url],
          ['status', response.status.toString()],
        ],
      });
    }

    const data = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) => new ParseError({ url, tags: [['url', url]], cause }),
    });

    return yield* Schema.decodeUnknownEffect(ChartData)(data).pipe(
      Effect.mapError((cause) => new ParseError({ url, tags: [['url', url]], cause })),
    );
  }).pipe(
    Effect.tapError((error) => Effect.sync(() => logger.warn(`Failed to fetch chart data: ${formatTags(error.tags)}`))),
    Effect.catch(() => Effect.succeed(undefined)),
  );
}
