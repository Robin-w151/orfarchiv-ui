import { formatTags, ParseError } from '$lib/errors/errors';
import { ChartData } from '$lib/models/charts';
import { logger } from '$lib/utils/logger';
import { Context, Effect, Layer, Schema } from 'effect';
import { FetchService, type FetchServiceShape } from '../fetch';

export class ChartService extends Context.Service<ChartService>()('content/transform/ChartService', {
  make: Effect.gen(function* () {
    const fetchService = yield* FetchService;

    return defineService({ fetchService });
  }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies.pipe(Layer.provide(FetchService.layer));
}

function defineService({ fetchService }: { fetchService: FetchServiceShape }) {
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

      const data = yield* fetchService.fetchUrl(`${url}/config.json`, 'json');

      return yield* Schema.decodeUnknownEffect(ChartData)(data).pipe(
        Effect.mapError((cause) => new ParseError({ url, tags: [['url', url]], cause })),
      );
    }).pipe(
      Effect.tapError((error) =>
        Effect.sync(() => logger.warn(`Failed to fetch chart data: ${formatTags(error.tags)}`)),
      ),
      Effect.catch(() => Effect.succeed(undefined)),
    );
  }

  return { removeCharts };
}
