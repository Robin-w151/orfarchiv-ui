import { expect, type Page } from '@playwright/test';

export async function waitForTestReady(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-test', 'ready');
}
