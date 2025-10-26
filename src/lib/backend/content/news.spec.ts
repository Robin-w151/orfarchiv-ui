import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchStoryContent } from './news';
import prettier from 'prettier';
import { ContentNotFoundError, OptimizedContentIsEmptyError } from '$lib/errors/errors';

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
    mockedSearchStory: vi.fn().mockImplementation((url) => {
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

      const { content } = await fetchStoryContent(mockArticleUrl);

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('empty article', async () => {
      mockArticle('');

      await expect(fetchStoryContent(mockArticleUrl)).rejects.toThrowError(OptimizedContentIsEmptyError);
    });

    test('content not found', async () => {
      mockedFetch.mockResolvedValue({ ok: false, text: () => Promise.reject(new Error('Content not found')) });

      await expect(fetchStoryContent(mockArticleUrl)).rejects.toThrowError(ContentNotFoundError);
    });

    test('adjust list with empty items', async () => {
      mockArticle(`
        <ul>
          <li>Item 1</li>
          <li></li>
          <li>Item 3</li>
        </ul>
      `);

      const { content } = await fetchStoryContent(mockArticleUrl);

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

      const { content } = await fetchStoryContent(mockArticleUrl);

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

      const { content } = await fetchStoryContent(mockArticleUrl);

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('remove video', async () => {
      mockArticle(`
        <p>Hello World</p>
        <section class="stripe">
          <video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></video>
        </section>
      `);

      const { content } = await fetchStoryContent(mockArticleUrl);

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('remove more to read section', async () => {
      mockArticle(`
        <p>Hello World</p>
        <div id="more-to-read">
          <p>More to read</p>
        </div>
      `);

      const { content } = await fetchStoryContent(mockArticleUrl);

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('remove site navigation', async () => {
      mockArticle(`
        <p>Hello World</p>
        <nav>
          <a href="https://www.orf.at/">Home</a>
        </nav>
      `);

      const { content } = await fetchStoryContent(mockArticleUrl);

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('remove site anchors', async () => {
      mockArticle(`
        <p>Hello World</p>
        <a href="https://www.orf.at/#/article/1234567890">Article</a>
      `);

      const { content } = await fetchStoryContent(mockArticleUrl);

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

      const { content, id, source } = await fetchStoryContent(mockArticleUrl, fetchReadMore);

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

      const { content } = await fetchStoryContent(mockArticleUrl);

      await expect(content).toBeHtml(expected);
    });
  });
});

function mockArticle(html: string | Map<string, string>): void {
  mockedFetch.mockImplementation((url) => {
    return Promise.resolve({ ok: true, text: () => Promise.resolve(typeof html === 'object' ? html.get(url) : html) });
  });
}

function formatHtml(html: string): Promise<string> {
  return prettier.format(html, { parser: 'html', printWidth: 80, bracketSameLine: true });
}
