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

const { mockedFetch, mockedSearchStory } = vi.hoisted(() => {
  return {
    mockedFetch: vi.fn(),
    mockedSearchStory: vi.fn().mockResolvedValue({
      id: '1234567890',
      title: 'Hello World',
      timestamp: new Date('2025-01-01T00:00:00.000Z'),
      source: 'news',
      category: 'News',
      url: 'https://www.orf.at/stories/1234567890',
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

      const { content } = await fetchStoryContent('https://www.orf.at/stories/1234567890');

      await expect(content).toBeHtml('<div id="readability-page-1" class="page"><p>Hello World</p></div>');
    });

    test('empty article', async () => {
      mockArticle('');

      await expect(fetchStoryContent('https://www.orf.at/stories/1234567890')).rejects.toThrowError(
        OptimizedContentIsEmptyError,
      );
    });

    test('content not found', async () => {
      mockedFetch.mockResolvedValue({ ok: false, text: () => Promise.reject(new Error('Content not found')) });

      await expect(fetchStoryContent('https://www.orf.at/stories/1234567890')).rejects.toThrowError(
        ContentNotFoundError,
      );
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
    ])('$title', async ({ article, expected }) => {
      mockArticle(article);

      const { content } = await fetchStoryContent('https://www.orf.at/stories/1234567890');

      await expect(content).toBeHtml(expected);
    });
  });
});

function mockArticle(html: string): void {
  mockedFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve(html) });
}

function formatHtml(html: string): Promise<string> {
  return prettier.format(html, { parser: 'html', printWidth: 80 });
}
