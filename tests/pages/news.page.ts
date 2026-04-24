import type { Locator, Page } from '@playwright/test';
import { newsMockEmptyUpdate } from '../mocks/news.mocks';
import { waitForTestReady } from '../shared/waitForTestReady';

export class NewsPage {
  log: unknown[] = [];

  get titleLink(): Locator {
    return this.page.locator('header > h1 > a');
  }

  get newsLink(): Locator {
    return this.page.locator('header nav').getByRole('link', { name: 'News' });
  }

  get loadUpdateLink(): Locator {
    return this.page.locator('header nav').getByRole('link', { name: 'Aktualisieren' });
  }

  get loadMoreButton(): Locator {
    return this.page.locator('main > div > button');
  }

  get newsFilter(): Locator {
    return this.page.locator('#news #news-filter');
  }

  get newsFilterTagMenuButton(): Locator {
    return this.newsFilter.getByTitle('Schlagwörter');
  }

  get newsFilterOtherMenuButton(): Locator {
    return this.newsFilter.getByTitle('Weitere Filter-Optionen');
  }

  get textFilterInput(): Locator {
    return this.newsFilter.locator('input');
  }

  get textFilterClearButton(): Locator {
    return this.newsFilter.locator('input + button');
  }

  get newsListItems(): Locator {
    return this.page.locator('#news ul > li');
  }

  get newsListSections(): Locator {
    return this.page.locator('#news section');
  }

  get newsNoContentInfo(): Locator {
    return this.page.locator(
      'text=Keine Nachrichten gefunden Bitte versuchen Sie es später erneut oder ändern Sie die Filter.',
    );
  }

  get aiSummaryButton(): Locator {
    return this.page.getByRole('button', { name: 'KI-Zusammenfassung' });
  }

  get aiSummaryContent(): Locator {
    return this.modal.locator('article[data-testid="ai-summary"]');
  }

  get aiSummaryRegenerateButton(): Locator {
    return this.modal.getByRole('button', { name: 'Erneut generieren' });
  }

  get aiSummaryNavigateToSettingsButton(): Locator {
    return this.page.getByRole('link', { name: 'Zu den Einstellungen' });
  }

  get popover(): Locator {
    return this.page.locator('div[data-testid="popover"]');
  }

  get modal(): Locator {
    return this.page.locator('dialog[data-testid="modal"]');
  }

  get modalCloseButton(): Locator {
    return this.modal.getByRole('button', { name: 'Schließen' });
  }

  constructor(private readonly page: Page) {}

  async visitSite(): Promise<void> {
    await this.newsLink.click();
  }

  async reloadSite(): Promise<void> {
    await this.page.reload();
    await waitForTestReady(this.page);
  }

  getTagButton(tag: string): Locator {
    return this.newsFilter.getByRole('button', { name: tag });
  }

  getDateFilterInput(name: string): Locator {
    return this.popover.getByPlaceholder(name);
  }

  getNewsListSection(index: number): Locator {
    return this.newsListSections.nth(index);
  }

  getNewsListItem(index: number): Locator {
    return this.newsListItems.nth(index);
  }

  getStoryContent(index: number): Locator {
    return this.getNewsListItem(index).locator('article');
  }

  async mockSearchNewsApi(
    data: unknown,
    { filter, update }: { filter?: string; update?: boolean } = {},
  ): Promise<void> {
    await this.page.route('**/api/trpc/news.search**', (route) => {
      const url = new URL(route.request().url());
      const input = JSON.parse(url.searchParams.get('input') ?? '{}');

      if (input.pageKey?.type === 'prev' && !update) {
        route.fulfill({
          status: 200,
          body: this.toTrpcResponseData(newsMockEmptyUpdate),
        });
        return;
      }

      if (
        (!filter && !input.searchRequestParameters.textFilter) ||
        filter === input.searchRequestParameters.textFilter
      ) {
        route.fulfill({
          status: 200,
          body: this.toTrpcResponseData(data),
        });
      } else {
        route.continue();
      }
    });
  }

  async mockFetchContentApi(data: unknown, failOnFirstTry = false): Promise<void> {
    let firstTry = true;

    await this.page.route('**/api/trpc/news.content**', (route) => {
      if (firstTry && failOnFirstTry) {
        route.fulfill({
          status: 500,
        });
        firstTry = false;
      } else {
        route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: this.toTrpcResponseData(data),
        });
      }
    });
  }

  async mockAiSummaryApi(data: Record<string, unknown> | Record<string, unknown>[]): Promise<void> {
    const responses = Array.isArray(data) ? data : [data];
    let responseIndex = 0;

    await this.page.route('**/v1beta/openai/chat/completions**', (route) => {
      const responsePayload = responses[Math.min(responseIndex, responses.length - 1)];
      responseIndex += 1;

      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(responsePayload),
              },
            },
          ],
          usage: {
            total_tokens: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
          },
        }),
      });
    });
  }

  async waitForContent(): Promise<void> {
    return this.loadMoreButton.waitFor();
  }

  async waitForSearch(): Promise<void> {
    await this.page.waitForResponse(/\/api\/trpc\/news.search/i);
  }

  async waitForStoryContent(): Promise<void> {
    await this.page.waitForResponse(/\/api\/trpc\/news.content/i);
  }

  async waitForAiSummary(): Promise<void> {
    await this.page.waitForResponse(/\/v1beta\/openai\/chat\/completions/i);
  }

  async searchNews(textFilter: string): Promise<void> {
    const search = this.waitForSearch();
    await this.textFilterInput.fill(textFilter);
    await search;
  }

  async searchNewsUpdates(): Promise<void> {
    const search = this.waitForSearch();
    await this.loadUpdateLink.click();
    await search;
  }

  async searchMoreNews(): Promise<void> {
    const search = this.waitForSearch();
    await this.loadMoreButton.click();
    await search;
  }

  async clearTextFilter(): Promise<void> {
    const search = this.waitForSearch();
    await this.textFilterClearButton.click();
    await search;
  }

  async openStoryContent(index: number): Promise<void> {
    const request = this.waitForStoryContent();
    await this.toggleStoryContent(index);
    await request;
  }

  async toggleStoryContent(index: number): Promise<void> {
    const storyHeader = this.getNewsListItem(index).locator('header');
    await storyHeader.click();
  }

  private toTrpcResponseData(data: unknown): string {
    return JSON.stringify({
      result: {
        data,
      },
    });
  }
}
