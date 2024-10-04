import { newsMock } from './mocks/news.mocks';
import { NewsPage } from './pages/news.page';
import { test as base, expect, type Page } from '@playwright/test';
import { SettingsPage } from './pages/settings.page';

interface TestFixtures {
  newsPage: NewsPage;
  settingsPage: SettingsPage;
}

export const test = base.extend<TestFixtures>({
  newsPage: async ({ page }, use) => {
    const newsPage = new NewsPage(page);
    await newsPage.mockSearchNewsApi(newsMock);
    await newsPage.visitSite();
    await newsPage.waitForContent();
    await waitForTestReady(page);

    await use(newsPage);
  },
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.visitSite();
    await waitForTestReady(page);

    use(settingsPage);
  },
});

async function waitForTestReady(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-test', 'ready');
}
