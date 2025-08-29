import type { Page, Locator } from '@playwright/test';

export class SettingsPage {
  get isPageActive(): Promise<boolean> {
    return this.page.waitForURL('/settings').then(() => true);
  }

  constructor(private readonly page: Page) {}

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

  async visitSite(): Promise<void> {
    const url = `/settings`;
    const response = await this.page.goto(url);
    if (!response || response.status() > 399) {
      throw new Error(`Failed with response code ${response?.status()}`);
    }
  }
}
