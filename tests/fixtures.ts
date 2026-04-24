import { test as base, expect, type Page } from '@playwright/test';
import { newsMock } from './mocks/news.mocks';
import { NewsPage } from './pages/news.page';
import { SettingsPage } from './pages/settings.page';

interface TestFixtures {
  newsPage: NewsPage;
  settingsPage: SettingsPage;
}

export const test = base.extend<TestFixtures>({
  newsPage: [
    async ({ page }, use) => {
      const newsPage = new NewsPage(page);
      const logCall = (message: string): void => {
        newsPage.log.push(message);
      };
      await page.exposeFunction('logCall', logCall);
      await page.addInitScript(() => {
        const navigator = globalThis.navigator;

        navigator.canShare = (data) => {
          logCall(`canShare: ${data?.text}`);
          return true;
        };

        (navigator as any).share = (data: any) => {
          logCall(`share: ${data?.text}`);
        };
      });

      await newsPage.mockSearchNewsApi(newsMock);
      await page.goto('/');
      await waitForTestReady(page);
      await newsPage.waitForContent();

      await use(newsPage);
    },
    { auto: true },
  ],
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);

    await use(settingsPage);
  },
});

async function waitForTestReady(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-test', 'ready');
}
