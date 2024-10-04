import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv-flow';

dotenv.config({ silent: true });

const isCI = !!process.env['CI'];
const baseURL = process.env['TEST_BASE_URL'] ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'x-vercel-skip-toolbar': '1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  expect: {
    timeout: 30_000,
  },
  retries: isCI ? 2 : 0,
});
