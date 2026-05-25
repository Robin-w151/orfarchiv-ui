import type { BrowserContext } from '@playwright/test';

export class WebErrorPage {
  readonly errors: unknown[] = [];

  constructor(context: BrowserContext) {
    context.on('weberror', (error) => {
      this.errors.push(error);
    });
  }
}
