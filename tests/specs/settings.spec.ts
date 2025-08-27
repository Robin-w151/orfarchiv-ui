import { expect } from '@playwright/test';
import { test } from '../fixtures';

test.describe('SettingsPage', () => {
  test.describe('General', () => {
    const sectionTitle = 'Allgemein';

    test('fetch read more content', async ({ settingsPage }) => {
      const checkbox = settingsPage.getListSectionInput(sectionTitle, 'Inhalt von weiterführendem Artikel laden');
      await expect(checkbox).not.toBeChecked();

      await checkbox.click();
      await settingsPage.visitSite();

      await expect(checkbox).toBeChecked();
    });
  });

  test.describe('Info', () => {
    const sectionTitle = 'Info';

    test('version', async ({ settingsPage }) => {
      const version = settingsPage.getListSectionItem(sectionTitle, 0);
      await expect(version).toContainText('Version');
    });

    test('source code', async ({ settingsPage }) => {
      const sourceCode = settingsPage.getListSectionItem(sectionTitle, 1);
      await expect(sourceCode).toContainText('Quellcode auf GitHub');
    });

    test('powered by', async ({ settingsPage }) => {
      const poweredBy = settingsPage.getListSectionItem(sectionTitle, 2);
      await expect(poweredBy).toContainText('Powered by SvelteKit');
    });

    test('hosted on', async ({ settingsPage }) => {
      const hostedOn = settingsPage.getListSectionItem(sectionTitle, 3);
      await expect(hostedOn).toContainText('Gehostet bei Vercel');
    });
  });

  test.describe('Appearance', () => {
    const sectionTitle = 'Darstellung';

    test('system', async ({ settingsPage }) => {
      const radioButton = settingsPage.getListSectionInput(sectionTitle, 'Automatisch');
      await expect(radioButton).toBeChecked();
    });

    test('light', async ({ page, settingsPage }) => {
      const radioButton = settingsPage.getListSectionInput(sectionTitle, 'Hell');
      await expect(radioButton).not.toBeChecked();

      await radioButton.click();
      await page.waitForTimeout(250);
      await settingsPage.visitSite();

      await expect(radioButton).toBeChecked();
      await expect(page.locator('html')).not.toHaveClass('dark');
    });

    test('dark', async ({ page, settingsPage }) => {
      const radioButton = settingsPage.getListSectionInput(sectionTitle, 'Dunkel');
      await expect(radioButton).not.toBeChecked();

      await radioButton.click();
      await page.waitForTimeout(250);
      await settingsPage.visitSite();

      await expect(radioButton).toBeChecked();
      await expect(page.locator('html')).toHaveClass('dark');
    });
  });

  test.describe('AI', () => {
    const sectionTitle = 'Künstliche Intelligenz';

    test('enable ai summary', async ({ settingsPage }) => {
      const checkbox = settingsPage.getListSectionInput(sectionTitle, 'KI-Zusammenfassung aktivieren');
      await expect(checkbox).not.toBeChecked();

      await checkbox.click();
      await settingsPage.visitSite();

      await expect(checkbox).toBeChecked();
    });

    test('select lite model', async ({ settingsPage }) => {
      const checkbox = settingsPage.getListSectionInput(sectionTitle, 'KI-Zusammenfassung aktivieren');
      await checkbox.click();

      const model = settingsPage.getListSectionInput(sectionTitle, 'KI-Modell');
      await expect(model).toHaveValue('gemini-2.5-flash');

      await model.selectOption('gemini-2.5-flash-lite');
      await settingsPage.visitSite();

      await expect(model).toHaveValue('gemini-2.5-flash-lite');
    });

    test('enter api key', async ({ settingsPage }) => {
      const checkbox = settingsPage.getListSectionInput(sectionTitle, 'KI-Zusammenfassung aktivieren');
      await checkbox.click();

      const apiKey = settingsPage.getListSectionInput(sectionTitle, 'Gemini API-Key');
      await expect(apiKey).toHaveValue('');

      await apiKey.fill('test');
      await settingsPage.visitSite();

      await expect(apiKey).toHaveValue('test');
    });
  });

  test.describe('Source', () => {
    const sectionTitle = 'Quellen';
    const sources = [
      'News',
      'Sport',
      'Help',
      'Science',
      'Religion',
      'Ö3',
      'FM4',
      'Österreich',
      'Burgenland',
      'Wien',
      'Niederösterreich',
      'Oberösterreich',
      'Salzburg',
      'Steiermark',
      'Kärnten',
      'Tirol',
      'Vorarlberg',
    ];

    for (const source of sources) {
      test(source, async ({ settingsPage }) => {
        const checkbox = settingsPage.getListSectionInput(sectionTitle, source);
        await expect(checkbox).toBeChecked();

        await checkbox.click();
        await settingsPage.visitSite();

        await expect(checkbox).not.toBeChecked();
      });
    }
  });
});
