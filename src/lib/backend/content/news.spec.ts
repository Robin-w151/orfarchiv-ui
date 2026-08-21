import { ContentNotFoundError, OptimizedContentIsEmptyError } from '$lib/errors/errors';
import { Result } from 'effect';
import prettier from 'prettier';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchStoryContent } from './news';

interface CustomMatchers<R = unknown> {
  toBeHtml: (expected: string) => Promise<R>;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<T = any> extends CustomMatchers<T> {}
}

const {
  mockArticleUrl,
  mockReadMoreArticleId,
  mockReadMoreArticleUrl,
  mockReadMoreArticleSource,
  mockedFetch,
  mockedSearchStory,
} = vi.hoisted(() => {
  const articleId = '1234567890';
  const articleUrl = `https://www.orf.at/stories/${articleId}`;
  const articleSource = 'news';
  const readMoreArticleId = '1234567891';
  const readMoreArticleUrl = `https://www.orf.at/stories/${readMoreArticleId}`;
  const readMoreArticleSource = 'sport';

  const story = {
    id: articleId,
    title: 'Hello World',
    timestamp: new Date('2025-01-01T00:00:00.000Z'),
    source: articleSource,
    category: 'News',
    url: articleUrl,
  };
  const readMoreStory = {
    id: readMoreArticleId,
    title: 'Goodbye World',
    timestamp: new Date('2025-01-02T00:00:00.000Z'),
    source: readMoreArticleSource,
    category: 'Sport',
    url: readMoreArticleUrl,
  };

  return {
    mockArticleId: articleId,
    mockArticleUrl: articleUrl,
    mockArticleSource: articleSource,
    mockReadMoreArticleId: readMoreArticleId,
    mockReadMoreArticleUrl: readMoreArticleUrl,
    mockReadMoreArticleSource: readMoreArticleSource,
    mockedFetch: vi.fn(),
    mockedSearchStory: vi.fn().mockImplementation(async (url) => {
      if (url === readMoreArticleUrl) {
        return readMoreStory;
      } else {
        return story;
      }
    }),
  };
});

vi.mock('$lib/backend/db/news', () => {
  return {
    searchStory: mockedSearchStory,
  };
});

expect.extend({
  async toBeHtml(actual: string, expected: string) {
    const { isNot } = this;
    const formattedActual = await formatHtml(actual);
    const formattedExpected = await formatHtml(expected);
    return {
      message: () => `Expected '${formattedActual}' ${isNot ? 'not ' : ''}to be equal to '${formattedExpected}'`,
      pass: formattedActual === formattedExpected,
      actual: formattedActual,
      expected: formattedExpected,
    };
  },
});

describe('News content', () => {
  beforeEach(() => {
    globalThis.fetch = mockedFetch;
  });

  describe('General', () => {
    test('simple article', async () => {
      mockArticle('<p>Hello World</p>');

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('empty article', async () => {
      mockArticle('');

      const result = await fetchStoryContent(mockArticleUrl);
      const error = Result.isFailure(result) ? result.failure : undefined;

      expect(error).toEqual(
        new OptimizedContentIsEmptyError({
          url: mockArticleUrl,
          tags: [['url', mockArticleUrl]],
          message: "Optimized content from url='https://www.orf.at/stories/1234567890' is empty",
        }),
      );
    });

    test('content not found', async () => {
      mockedFetch.mockResolvedValue(htmlResponse('Content not found', 404));

      const result = await fetchStoryContent(mockArticleUrl);
      const error = Result.isFailure(result) ? result.failure : undefined;

      expect(error).toEqual(
        new ContentNotFoundError({
          url: mockArticleUrl,
          tags: [
            ['url', mockArticleUrl],
            ['status', '404'],
          ],
          message: `Content from url='https://www.orf.at/stories/1234567890' cannot be loaded`,
        }),
      );
    });

    test('adjust list with empty items', async () => {
      mockArticle(`
        <ul>
          <li>Item 1</li>
          <li></li>
          <li>Item 3</li>
        </ul>
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml(`
        <div id="readability-page-1" class="page">
          <ul>
            <li>Item 1</li>

            <li>Item 3</li>
          </ul>
        </div>
      `);
    });

    test('sanitize content', async () => {
      mockArticle(`
        <p tabindex="0">Hello World</p>
        <a href="https://example.com" target="_blank">Example</a>
        <script>alert('Hello World');</script>
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml(`
        <div id="readability-page-1" class="page">
          <p>Hello World</p>
          <a href="https://example.com/" target="_blank" rel="noopener noreferrer">Example</a>
        </div>
      `);
    });
  });

  describe('Remove elements', () => {
    test('remove print warning', async () => {
      mockArticle(`
        <p>Hello World</p>
        <p class="print-warning">Print warning</p>
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('remove video', async () => {
      mockArticle(`
        <p>Hello World</p>
        <section class="stripe">
          <video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></video>
        </section>
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('remove more to read section', async () => {
      mockArticle(`
        <p>Hello World</p>
        <div id="more-to-read">
          <p>More to read</p>
        </div>
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('remove site navigation', async () => {
      mockArticle(`
        <p>Hello World</p>
        <nav>
          <a href="https://www.orf.at/">Home</a>
        </nav>
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('remove site anchors', async () => {
      mockArticle(`
        <p>Hello World</p>
        <a href="https://www.orf.at/#/article/1234567890">Article</a>
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });
  });

  describe('Read more', () => {
    test.each([
      {
        title: 'article with read more url',
        article: `
          <p>Hello World</p>
          <p></p>
          <p>Mehr in <a href="${mockReadMoreArticleUrl}">hier</a></p>
        `,
        readMoreArticle: `
          <p>Goodbye World</p>
        `,
        expected: `<div id="readability-page-1" class="page"><p>Goodbye World</p></div>`,
        expectedId: mockReadMoreArticleId,
        expectedSource: mockReadMoreArticleSource,
      },
      {
        title: 'article with invalid read more url',
        article: `
          <p>Hello World</p>
          <p>Mehr in <a href="https://asdf.com/">hier</a></p>
        `,
        readMoreArticle: `
          <p>Goodbye World</p>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <p>Hello World</p>
            <p>Mehr in <a href="https://asdf.com/" target="_blank" rel="noopener noreferrer">hier</a></p>
          </div>
        `,
      },
      {
        title: 'article with read more url and fetchReadMore disabled',
        article: `
          <p>Hello World</p>
          <p>Mehr in <a href="${mockReadMoreArticleUrl}">hier</a></p>
        `,
        readMoreArticle: `
          <p>Goodbye World</p>
        `,
        fetchReadMore: false,
        expected: `
          <div id="readability-page-1" class="page">
            <p>Hello World</p>
            <p>Mehr in <a href="${mockReadMoreArticleUrl}" target="_blank" rel="noopener noreferrer">hier</a></p>
          </div>
        `,
      },
      {
        title: 'article with read more url and too many paragraphs',
        article: `
          <p>Hello World</p>
          <p>Lorem ipsum</p>
          <p>Lorem ipsum</p>
          <p>Lorem ipsum</p>
          <p>Mehr in <a href="${mockReadMoreArticleUrl}">hier</a></p>
        `,
        readMoreArticle: `
          <p>Goodbye World</p>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <p>Hello World</p>
            <p>Lorem ipsum</p>
            <p>Lorem ipsum</p>
            <p>Lorem ipsum</p>
            <p>Mehr in <a href="${mockReadMoreArticleUrl}" target="_blank" rel="noopener noreferrer">hier</a></p>
          </div>
        `,
      },
    ])('$title', async ({ article, readMoreArticle, fetchReadMore = true, expected, expectedId, expectedSource }) => {
      mockArticle(
        new Map([
          [mockArticleUrl, article],
          [mockReadMoreArticleUrl, readMoreArticle],
        ]),
      );

      const result = await fetchStoryContent(mockArticleUrl, fetchReadMore);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;
      const id = Result.isSuccess(result) ? result.success.id : undefined;
      const source = Result.isSuccess(result) ? result.success.source : undefined;

      await expect(content).toBeHtml(expected);
      expect(id).toBe(expectedId);
      expect(source?.name).toBe(expectedSource);
    });
  });

  describe('Tables', () => {
    test.each([
      {
        title: 'simple table',
        article: `
          <table>
            <thead>
              <tr>
                <th>Column 1</th>
                <th>Column 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <thead>
                <tr>
                  <th>Column 1</th>
                  <th>Column 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        title: 'table without header',
        article: `
          <table>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td>Data 3</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>
                  <td>Data 3</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        title: 'table with empty column',
        article: `
          <table>
            <thead>
              <tr>
                <th>Column 1</th>
                <th></th>
                <th>Column 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td></td>
                <td>Data 2</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <thead>
                <tr>
                  <th>Column 1</th>

                  <th>Column 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>

                  <td>Data 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        title: 'table with some empty cells',
        article: `
          <table>
            <thead>
              <tr>
                <th>Column 1</th>
                <th>Column 2</th>
                <th>Column 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td></td>
                <td>Data 3</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <thead>
                <tr>
                  <th>Column 1</th>
                  <th>Column 2</th>
                  <th>Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td></td>
                  <td>Data 3</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        title: 'empty table',
        article: `
          <p>Hello World</p>
          <table>
            <thead>
            </thead>
            <tbody>
            </tbody>
          </table>
        `,
        expected: `<div id="readability-page-1" class="page"><p>Hello World</p></div>`,
      },
      {
        title: 'table with invalid structure',
        article: `
          <p>Hello World</p>
          <table>
            <thead>
              <tr>
                <th>Column 1</th>
                <th>Column 2</th>
                <th>Column 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td>Data 3</td>
                <td>Data 4</td>
              </tr>
              <tr>
                <td>Data 5</td>
                <td>Data 6</td>
                <td>Data 7</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `<div id="readability-page-1" class="page"><p>Hello World</p></div>`,
      },
      {
        title: 'table with col span',
        article: `
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Column 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="2">Data 1</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Column 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="2">Data 1</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        title: 'table with header using col span',
        article: `
          <table>
            <thead>
              <tr>
                <th colspan="2">Column 1</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <thead>
                <tr>
                  <th colspan="2">Column 1</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        title: 'table with col span and invalid structure',
        article: `
          <p>Hello World</p>
          <table>
            <thead>
              <tr>
                <th>Column 1</th>
                <th>Column 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td colspan="2">Data 2</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `<div id="readability-page-1" class="page"><p>Hello World</p></div>`,
      },
      {
        title: 'table with row and col span',
        article: `
          <table>
            <thead>
              <tr>
                <th colspan="2" rowspan="2">Column 1</th>
                <th>Column 2</th>
                <th>Column 3</th>
              </tr>
              <tr>
                <th>Column 4</th>
                <th>Column 5</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td colspan="2" rowspan="2">Data 3</td>
              </tr>
              <tr>
                <td>Data 5</td>
                <td>Data 6</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <thead>
                <tr>
                  <th colspan="2" rowspan="2">Column 1</th>
                  <th>Column 2</th>
                  <th>Column 3</th>
                </tr>
                <tr>
                  <th>Column 4</th>
                  <th>Column 5</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>
                  <td colspan="2" rowspan="2">Data 3</td>
                </tr>
                <tr>
                  <td>Data 5</td>
                  <td>Data 6</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        title: 'table with row and col span and invalid structure',
        article: `
          <p>Hello World</p>
          <table>
            <thead>
              <tr>
                <th colspan="2" rowspan="2">Column 1</th>
                <th>Column 2</th>
                <th>Column 3</th>
              </tr>
              <tr>
                <th>Column 4</th>
                <th>Column 5</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td colspan="2" rowspan="2">Data 3</td>
              </tr>
              <tr>
                <td>Data 5</td>
                <td>Data 6</td>
                <td>Data 7</td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `<div id="readability-page-1" class="page"><p>Hello World</p></div>`,
      },
      {
        title: 'table with row and col span and empty column',
        article: `
          <table>
            <thead>
              <tr>
                <th colspan="2" rowspan="2">Column 1</th>
                <th></th>
                <th>Column 2</th>
                <th>Column 3</th>
              </tr>
              <tr>
                <th></th>
                <th>Column 4</th>
                <th>Column 5</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td></td>
                <td colspan="2" rowspan="2">Data 3</td>
              </tr>
              <tr>
                <td>Data 5</td>
                <td>Data 6</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <thead>
                <tr>
                  <th colspan="2" rowspan="2">Column 1</th>

                  <th>Column 2</th>
                  <th>Column 3</th>
                </tr>
                <tr>

                  <th>Column 4</th>
                  <th>Column 5</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>

                  <td colspan="2" rowspan="2">Data 3</td>
                </tr>
                <tr>
                  <td>Data 5</td>
                  <td>Data 6</td>

                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
      {
        title: 'table with row span and some empty cells',
        article: `
          <table>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td></td>
              </tr>
              <tr>
                <td>Data 4</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
        `,
        expected: `
          <div id="readability-page-1" class="page">
            <table>
              <tbody>
                <tr>
                  <td>Data 1</td>
                  <td>Data 2</td>

                </tr>
                <tr>
                  <td>Data 4</td>
                  <td colspan="1"></td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
      },
    ])('$title', async ({ article, expected }) => {
      mockArticle(article);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml(expected);
    });
  });

  describe('Charts', () => {
    test('replace chart with titled placeholder anchor', async () => {
      const chartUrl = 'https://charts.orf.at/chart-1';
      const article = `
        <p>Hello World</p>
        <div class="embed migsys">
          <div class="migsys" data-mig-url="${chartUrl}"></div>
        </div>
      `;

      mockedFetch.mockImplementation((url) => {
        const requestedUrl = String(url);

        if (requestedUrl === mockArticleUrl) {
          return Promise.resolve(htmlResponse(article));
        }
        if (requestedUrl === `${chartUrl}/config.json`) {
          return Promise.resolve(jsonResponse({ title: '  Wahl 2026  ' }));
        }

        return Promise.reject(new Error(`Unexpected request url: ${requestedUrl}`));
      });

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml(`
        <div id="readability-page-1" class="page">
          <p>Hello World</p>
          <a href="${mockArticleUrl}" target="_blank" rel="noopener noreferrer">Grafik zu „Wahl 2026“</a>
        </div>
      `);
    });

    test('replace chart with unknown placeholder anchor when chart data has no title', async () => {
      const chartUrl = 'https://charts.orf.at/chart-2';
      const article = `
        <p>Hello World</p>
        <div class="embed migsys">
          <div class="migsys" data-mig-url="${chartUrl}"></div>
        </div>
      `;

      mockedFetch.mockImplementation((url) => {
        const requestedUrl = String(url);

        if (requestedUrl === mockArticleUrl) {
          return Promise.resolve(htmlResponse(article));
        }
        if (requestedUrl === `${chartUrl}/config.json`) {
          return Promise.resolve(jsonResponse({}));
        }

        return Promise.reject(new Error(`Unexpected request url: ${requestedUrl}`));
      });

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml(`
        <div id="readability-page-1" class="page">
          <p>Hello World</p>
          <a href="${mockArticleUrl}" target="_blank" rel="noopener noreferrer">Grafik zu „unbekannt“</a>
        </div>
      `);
    });

    test('replace chart with unknown placeholder anchor when chart request fails', async () => {
      const chartUrl = 'https://charts.orf.at/chart-3';
      const article = `
        <p>Hello World</p>
        <div class="embed migsys">
          <div class="migsys" data-mig-url="${chartUrl}"></div>
        </div>
      `;

      mockedFetch.mockImplementation((url) => {
        const requestedUrl = String(url);

        if (requestedUrl === mockArticleUrl) {
          return Promise.resolve(htmlResponse(article));
        }
        if (requestedUrl === `${chartUrl}/config.json`) {
          return Promise.resolve(jsonResponse({}, 500));
        }

        return Promise.reject(new Error(`Unexpected request url: ${requestedUrl}`));
      });

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml(`
        <div id="readability-page-1" class="page">
          <p>Hello World</p>
          <a href="${mockArticleUrl}" target="_blank" rel="noopener noreferrer">Grafik zu „unbekannt“</a>
        </div>
      `);
    });
  });

  describe('Images', () => {
    test('transform image with caption and credit', async () => {
      mockArticle(`
        <figure>
          <div class="image-container">
            <div class="image">
              <picture>
                <img loading="lazy" src="https://foo.bar/example-image" width="5760" height="3219" alt="Test alt text" class="image">
              </picture>
            </div>
            <span class="image-credit-tag">Test credits</span>
          </div>
          <figcaption class="caption">Test caption</figcaption>
        </figure>  
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : undefined;

      await expect(content).toBeHtml(`<div id="readability-page-1" class="page">
          <figure>
            <div class="image-container">
              <div>
                <picture>
                  <img loading="lazy" src="https://foo.bar/example-image" width="5760" height="3219" alt="Test alt text">
                </picture>
              </div>
              <p><span class="image-credit-tag">Test credits</span></p>
            </div>
            <figcaption>Test caption</figcaption>
          </figure>
        </div>
      `);
    });

    test('add dimensions from lazy loading placeholder', async () => {
      const placeholder = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5000 3333'/>",
      )}`;
      mockArticle(`
        <p>${'Lorem ipsum dolor sit amet. '.repeat(20)}</p>
        <img class="lazy-loading" src="${placeholder}"
          data-src="https://foo.bar/crops/w=1280,q=90/example-image" alt="Test alt text">
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : '';

      expect(content).toContain('width="5000"');
      expect(content).toContain('height="3333"');
    });

    test('add dimensions from lazy loading placeholder with raw percent character', async () => {
      const placeholder =
        "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' viewBox='0 0 5000 3333'/>";
      mockArticle(`
        <p>${'Lorem ipsum dolor sit amet. '.repeat(20)}</p>
        <img class="lazy-loading" src="${placeholder}"
          data-src="https://foo.bar/crops/w=1280,q=90/example-image" alt="Test alt text">
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : '';

      expect(content).toContain('width="5000"');
      expect(content).toContain('height="3333"');
    });

    test('add dimensions from crop url', async () => {
      mockArticle(`
        <p>${'Lorem ipsum dolor sit amet. '.repeat(20)}</p>
        <img src="https://foo.bar/crops/w=640,h=256,q=70/example-image" alt="Test alt text">
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : '';

      expect(content).toContain('width="640"');
      expect(content).toContain('height="256"');
    });

    test('add dimensions from crop url of lazy loading attributes', async () => {
      const placeholder = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg'/>",
      )}`;
      mockArticle(`
        <p>${'Lorem ipsum dolor sit amet. '.repeat(20)}</p>
        <img class="lazy-loading" src="${placeholder}"
          data-srcset="https://foo.bar/crops/w=640,h=256,q=70/example-image 1x" alt="Test alt text">
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : '';

      expect(content).toContain('width="640"');
      expect(content).toContain('height="256"');
    });

    test('keep existing dimensions', async () => {
      mockArticle(`
        <p>${'Lorem ipsum dolor sit amet. '.repeat(20)}</p>
        <img src="https://foo.bar/crops/w=640,h=256,q=70/example-image" width="800" height="600" alt="Test alt text">
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : '';

      expect(content).toContain('width="800"');
      expect(content).toContain('height="600"');
    });

    test('keep image without any dimension information', async () => {
      mockArticle(`
        <p>${'Lorem ipsum dolor sit amet. '.repeat(20)}</p>
        <img src="https://foo.bar/example-image" alt="Test alt text">
      `);

      const result = await fetchStoryContent(mockArticleUrl);
      const content = Result.isSuccess(result) ? result.success.contentHtml : '';

      expect(content).toContain('src="https://foo.bar/example-image"');
      expect(content).not.toContain('width=');
    });
  });
});

function mockArticle(html: string | Map<string, string>): void {
  mockedFetch.mockImplementation((url) => {
    const requestedUrl = String(url);
    const content = typeof html === 'object' ? html.get(requestedUrl) : html;

    if (content === undefined) {
      return Promise.resolve(htmlResponse('', 404));
    }

    return Promise.resolve(htmlResponse(content));
  });
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, { status, headers: { 'content-type': 'text/html' } });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

function formatHtml(html: string): Promise<string> {
  return prettier.format(html, { parser: 'html', printWidth: 80, bracketSameLine: true });
}
