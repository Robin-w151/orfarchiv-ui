import { expect, type Locator } from '@playwright/test';
import { test } from '../fixtures';
import {
  contentMock,
  contentMockText,
  newsMock,
  newsMockMore,
  newsMockNoContent,
  newsMockUpdate,
  newsMockWithFilter,
} from '../mocks/news.mocks';
import { DateTime } from 'luxon';

test.describe('NewsPage', () => {
  let log: any;

  test.beforeEach(async ({ page }) => {
    log = [];
    const logCall = (message: string): void => log.push(message);
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
  });

  test.describe('Site', () => {
    test('title', async ({ newsPage }) => {
      await expect(newsPage.titleLink).toHaveAttribute('href', '/');
      await expect(newsPage.titleLink).toHaveText('ORF Archiv');
    });
  });

  test.describe('Search', () => {
    test('search news', async ({ newsPage }) => {
      const expectedCount = newsMock.stories.length;
      await expect(newsPage.newsListItems).toHaveCount(expectedCount);
    });

    test('search news updates', async ({ newsPage }) => {
      await newsPage.mockSearchNewsApi(newsMockUpdate, { update: true });
      await newsPage.searchNewsUpdates();

      const expectedCount = newsMock.stories.length + newsMockUpdate.stories.length;
      await expect(newsPage.newsListItems).toHaveCount(expectedCount);
    });

    test('search more news', async ({ newsPage }) => {
      await newsPage.mockSearchNewsApi(newsMockMore);
      await newsPage.searchMoreNews();

      const expectedCount = newsMock.stories.length + newsMockMore.stories.length;
      await expect(newsPage.newsListItems).toHaveCount(expectedCount);
    });

    test('enter filter', async ({ newsPage }) => {
      await newsPage.mockSearchNewsApi(newsMockWithFilter, { filter: 'bei' });
      await newsPage.searchNews('bei');

      const expectedCount = newsMockWithFilter.stories.length;
      await expect(newsPage.newsListItems).toHaveCount(expectedCount);
    });

    test('enter filter without findings', async ({ newsPage }) => {
      await newsPage.mockSearchNewsApi(newsMockNoContent, { filter: 'suche ohne ergebnis' });
      await newsPage.searchNews('suche ohne ergebnis');

      await expect(newsPage.newsNoContentInfo).toBeVisible();
    });

    test('clear filter', async ({ newsPage }) => {
      await newsPage.mockSearchNewsApi(newsMockNoContent, { filter: 'suche ohne ergebnis' });
      await newsPage.searchNews('suche ohne ergebnis');

      await newsPage.mockSearchNewsApi(newsMock);
      await newsPage.clearTextFilter();

      await expect(newsPage.textFilterInput).toHaveValue('');
      const expectedCount = newsMock.stories.length;
      await expect(newsPage.newsListItems).toHaveCount(expectedCount);
    });

    test('date filter is changeable', async ({ newsPage }) => {
      await newsPage.newsFilterMenuButton.click();
      await expect(newsPage.getDateFilterInput('Von')).toBeEditable();
      await expect(newsPage.getDateFilterInput('Bis')).toBeEditable();
    });
  });

  test.describe('Sections', () => {
    test('Mittwoch, 07.09.2022', async ({ newsPage }) => {
      const sectionAktuell = newsPage.getNewsListSection(0);
      await expect(sectionAktuell.locator('h2')).toHaveText('Mittwoch, 07.09.2022');
      await expect(sectionAktuell.locator('li')).toHaveCount(1);
    });

    test('Dienstag, 06.09.2022', async ({ newsPage }) => {
      const sectionAktuell = newsPage.getNewsListSection(1);
      await expect(sectionAktuell.locator('h2')).toHaveText('Dienstag, 06.09.2022');
      await expect(sectionAktuell.locator('li')).toHaveCount(1);
    });

    test('Montag, 05.09.2022', async ({ newsPage }) => {
      const sectionAktuell = newsPage.getNewsListSection(2);
      await expect(sectionAktuell.locator('h2')).toHaveText('Montag, 05.09.2022');
      await expect(sectionAktuell.locator('li')).toHaveCount(1);
    });

    test('Sonntag, 04.09.2022', async ({ newsPage }) => {
      const sectionAktuell = newsPage.getNewsListSection(3);
      await expect(sectionAktuell.locator('h2')).toHaveText('Sonntag, 04.09.2022');
      await expect(sectionAktuell.locator('li')).toHaveCount(1);
    });

    test('Samstag, 03.09.2022', async ({ newsPage }) => {
      const sectionAktuell = newsPage.getNewsListSection(4);
      await expect(sectionAktuell.locator('h2')).toHaveText('Samstag, 03.09.2022');
      await expect(sectionAktuell.locator('li')).toHaveCount(1);
    });
  });

  test.describe('Story', () => {
    test('title', async ({ newsPage }) => {
      const storyIndex = 0;
      const storyTitle = newsPage.getNewsListItem(storyIndex).locator('header h3');
      const expectedStoryTitle = newsMock.stories[storyIndex].title;
      await expect(storyTitle).toHaveText(expectedStoryTitle);
    });

    test('info', async ({ newsPage }) => {
      const storyIndex = 1;
      const storyInfo = newsPage.getNewsListItem(storyIndex).locator('header h3 + span');

      const { category, timestamp } = newsMock.stories[storyIndex];
      const expectedStoryInfo = `${category} ${DateTime.fromISO(timestamp).toFormat('dd.MM.yyyy, HH:mm')}`;
      await expect(storyInfo).toHaveText(expectedStoryInfo);
    });
  });

  test.describe('Story options', () => {
    const storyIndex = 2;
    let storyMenu: Locator;

    test.beforeEach(async ({ newsPage }) => {
      storyMenu = newsPage.getNewsListItem(storyIndex).locator('button');
      await storyMenu.click();
    });

    test('article link', async ({ newsPage }) => {
      const articleLink = newsPage.popover.locator('a').nth(0);
      await articleLink.hover();
      await expect(articleLink).toBeVisible();

      const expectedHref = newsMock.stories[storyIndex].url;
      await expectExternalLink(articleLink, expectedHref);
    });

    test('bookmark button', async ({ page, newsPage }) => {
      const bookmarkButton = newsPage.popover.locator('button').nth(0);
      await bookmarkButton.hover();
      await expect(bookmarkButton).toBeVisible();
      await expect(bookmarkButton).toHaveText('Zu Lesezeichen hinzufügen');

      await bookmarkButton.click();
      await page.waitForTimeout(250);
      await storyMenu.click();
      await expect(bookmarkButton).toHaveText('Von Lesezeichen entfernen');
    });

    test('share button', async ({ newsPage }) => {
      const shareButton = newsPage.popover.locator('button').nth(1);
      await shareButton.hover();
      await expect(shareButton).toBeVisible();

      await shareButton.click();

      const expectedClipboardText = newsMock.stories[storyIndex].url;
      expect(log).toEqual([`canShare: ${expectedClipboardText}`, `share: ${expectedClipboardText}`]);
    });

    test('support link', async ({ newsPage }) => {
      const supportLink = newsPage.popover.locator('a').nth(1);
      await supportLink.hover();
      await expect(supportLink).toBeVisible();

      const expectedHref = 'https://der.orf.at/kontakt/orf-online-angebote100.html';
      await expectExternalLink(supportLink, expectedHref);
    });
  });

  test.describe('Content', () => {
    test('text', async ({ newsPage }) => {
      await newsPage.mockFetchContentApi(contentMock);

      const storyIndex = 0;
      await newsPage.openStoryContent(storyIndex);

      const storyContent = newsPage.getStoryContent(storyIndex);
      await expect(storyContent).toContainText(contentMockText);
    });

    test('is toggleable', async ({ newsPage }) => {
      await newsPage.mockFetchContentApi(contentMock);

      const storyIndex = 0;
      await newsPage.openStoryContent(storyIndex);

      const storyContent = newsPage.getStoryContent(storyIndex);
      await expect(storyContent).toBeVisible();

      await newsPage.toggleStoryContent(storyIndex);
      await expect(storyContent).not.toBeVisible();
    });

    test('retry on error', async ({ newsPage }) => {
      await newsPage.mockFetchContentApi(contentMock, true);

      const storyIndex = 0;
      await newsPage.openStoryContent(storyIndex);

      const storyContent = newsPage.getStoryContent(storyIndex);
      await expect(storyContent).toContainText(contentMockText);
    });

    test('ai summary error', async ({ newsPage, settingsPage }) => {
      const enableAiSummary = settingsPage.getListSectionInput(
        'Künstliche Intelligenz',
        'KI-Zusammenfassung aktivieren',
      );
      await expect(enableAiSummary).not.toBeChecked();
      await enableAiSummary.click();

      await newsPage.visitSite();
      await newsPage.mockFetchContentApi(contentMock);

      const storyIndex = 0;
      await newsPage.openStoryContent(storyIndex);
      await newsPage.aiSummaryButton.click();

      await expect(newsPage.modal).toContainText('Kein API-Key hinterlegt');
      await expect(newsPage.modal).toContainText('Es ist kein API-Key für die AI Zusammenfassung hinterlegt.');
    });

    test('ai summary error navigate to settings', async ({ newsPage, settingsPage }) => {
      const enableAiSummary = settingsPage.getListSectionInput(
        'Künstliche Intelligenz',
        'KI-Zusammenfassung aktivieren',
      );
      await expect(enableAiSummary).not.toBeChecked();
      await enableAiSummary.click();

      await newsPage.visitSite();
      await newsPage.mockFetchContentApi(contentMock);

      const storyIndex = 0;
      await newsPage.openStoryContent(storyIndex);
      await newsPage.aiSummaryButton.click();

      await newsPage.aiSummaryNavigateToSettingsButton.click();

      await expect(settingsPage.isPageActive).resolves.toBe(true);
    });
  });
});

async function expectExternalLink(locator: Locator, expectedHref: string): Promise<void> {
  await expect(locator).toHaveAttribute('href', expectedHref);
  await expect(locator).toHaveAttribute('target', '_blank');
}
