import type { Locator, Page } from '@playwright/test';
import { newsMockEmptyUpdate } from '../mocks/news.mocks';

export class NewsPage {
  get titleLink(): Locator {
    return this.page.locator('header > h1 > a');
  }

  get loadUpdateLink(): Locator {
    return this.page.locator("header nav a[title='Aktualisieren']");
  }

  get loadMoreButton(): Locator {
    return this.page.locator('main > div > button');
  }

  get newsFilter(): Locator {
    return this.page.locator('#news #news-filter');
  }

  get newsFilterMenuButton(): Locator {
    return this.newsFilter.locator('div + div > button');
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

  get popover(): Locator {
    return this.page.locator('div[data-testid="popover"]');
  }

  constructor(private readonly page: Page) {}

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

  async mockFetchContentApi(data: unknown): Promise<void> {
    await this.page.route('**/api/trpc/news.content**', (route) => {
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: this.toTrpcResponseData(data),
      });
    });
  }

  async visitSite(): Promise<void> {
    const url = `/`;
    const response = await this.page.goto(url);
    if (!response || response.status() > 399) {
      throw new Error(`Failed with response code ${response?.status()}`);
    }
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
