import type { Locator, Page } from '@playwright/test';

export class SettingsPage {
  get isPageActive(): Promise<boolean> {
    return this.page.waitForURL('/settings').then(() => true);
  }

  get settingsLink(): Locator {
    return this.page.locator('header nav').getByRole('link', { name: 'Einstellungen' });
  }

  constructor(private readonly page: Page) {}

  async visitSite(): Promise<void> {
    await this.settingsLink.click();
  }

  getListSection(sectionTitle: string): Locator {
    return this.page
      .locator('main section', { has: this.page.locator(`header > h2:text-is("${sectionTitle}")`) })
      .locator('ul');
  }

  getListSectionItem(sectionTitle: string, index: number): Locator {
    return this.getListSection(sectionTitle).locator('li').nth(index);
  }

  getListSectionInput(sectionTitle: string, label: string): Locator {
    return this.getListSection(sectionTitle).locator('li label', {
      has: this.page.locator(`text="${label}"`),
    });
  }
}
