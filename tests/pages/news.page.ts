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
      'text=Aktuell können keine Nachrichten geladen werden. Bitte versuchen Sie es später erneut oder ändern Sie die Filter.',
    );
  }

  get popover(): Locator {
    return this.page.locator('div[data-testid="popover"]');
  }

  constructor(private readonly page: Page) {}

  getDateFilterInput(name: string) {
    return this.popover.getByPlaceholder(name);
  }

  getNewsListSection(index: number) {
    return this.newsListSections.nth(index);
  }

  getNewsListItem(index: number) {
    return this.newsListItems.nth(index);
  }

  getStoryContent(index: number) {
    return this.getNewsListItem(index).locator('article');
  }

  async mockSearchNewsApi(data: unknown, { filter, update }: { filter?: string; update?: boolean } = {}) {
    await this.page.route('**/api/news/search**', (route) => {
      const url = new URL(route.request().url());
      const prevId = url.searchParams.get('prevId');
      if (prevId && !update) {
        route.fulfill({
          status: 200,
          body: JSON.stringify(newsMockEmptyUpdate),
        });
        return;
      }

      const filterParam = url.searchParams.get('textFilter');
      if ((!filter && !filterParam) || filter === filterParam) {
        route.fulfill({
          status: 200,
          body: JSON.stringify(data),
        });
      } else {
        route.continue();
      }
    });
  }

  async mockFetchContentApi(data: unknown) {
    await this.page.route('**/api/news/content**', (route) =>
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }),
    );
  }

  async visitSite() {
    const url = `/`;
    const response = await this.page.goto(url);
    if (!response || response.status() > 399) {
      throw new Error(`Failed with response code ${response?.status()}`);
    }
  }

  async waitForContent() {
    return this.loadMoreButton.waitFor();
  }

  async waitForSearch() {
    await this.page.waitForResponse(/\/api\/news\/search/i);
  }

  async waitForStoryContent() {
    await this.page.waitForResponse(/\/api\/news\/content/i);
  }

  async searchNews(textFilter: string) {
    const search = this.waitForSearch();
    await this.textFilterInput.fill(textFilter);
    await search;
  }

  async searchNewsUpdates() {
    const search = this.waitForSearch();
    await this.loadUpdateLink.click();
    await search;
  }

  async searchMoreNews() {
    const search = this.waitForSearch();
    await this.loadMoreButton.click();
    await search;
  }

  async clearTextFilter() {
    const search = this.waitForSearch();
    await this.textFilterClearButton.click();
    await search;
  }

  async openStoryContent(index: number) {
    const request = this.waitForStoryContent();
    await this.toggleStoryContent(index);
    await request;
  }

  async toggleStoryContent(index: number) {
    const storyHeader = this.getNewsListItem(index).locator('header');
    await storyHeader.click();
  }
}
