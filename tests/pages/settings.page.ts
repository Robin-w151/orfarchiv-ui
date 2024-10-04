import type { Page } from '@playwright/test';

export class SettingsPage {
  constructor(private readonly page: Page) {}

  getListSection(sectionTitle: string) {
    return this.page
      .locator('main section', { has: this.page.locator(`header > h2:text-is("${sectionTitle}")`) })
      .locator('ul');
  }

  getListSectionItem(sectionTitle: string, index: number) {
    return this.getListSection(sectionTitle).locator('li').nth(index);
  }

  getListSectionInput(sectionTitle: string, label: string) {
    return this.getListSection(sectionTitle).locator('li label', {
      has: this.page.locator(`text="${label}"`),
    });
  }

  async visitSite() {
    const url = `/settings`;
    const response = await this.page.goto(url);
    if (!response || response.status() > 399) {
      throw new Error(`Failed with response code ${response?.status()}`);
    }
  }
}
