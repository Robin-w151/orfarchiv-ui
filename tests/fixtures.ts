import { test as base, expect } from '@playwright/test';
import { newsMock } from './mocks/news.mocks';
import { NewsPage } from './pages/news.page';
import { SettingsPage } from './pages/settings.page';
import { waitForTestReady } from './shared/waitForTestReady';
import { WebErrorPage } from './pages/webError.page';

interface TestFixtures {
  newsPage: NewsPage;
  settingsPage: SettingsPage;
  webErrorPage: WebErrorPage;
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
  webErrorPage: [
    async ({ context }, use) => {
      const webErrorPage = new WebErrorPage(context);

      await use(webErrorPage);

      expect(webErrorPage.errors, 'Uncaught errors occurred').toHaveLength(0);
    },
    { auto: true },
  ],
});
