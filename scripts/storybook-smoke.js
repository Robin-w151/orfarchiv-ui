import { chromium } from '@playwright/test';

const ROOT_SELECTOR = '#storybook-root';
const ERROR_DISPLAY_CLASS = 'sb-show-errordisplay';
const RENDER_TIMEOUT_MS = 10_000;
const SETTLE_TIMEOUT_MS = 500;

await main();

async function main() {
  const base = process.argv[2]?.replace(/\/+$/, '');
  if (!base) {
    console.error('Usage: npm run storybook:smoke -- <storybook-base-url>');
    process.exit(1);
  }

  let browser;
  try {
    const storyIds = await fetchStoryIds(base);
    if (storyIds.length === 0) {
      throw new Error(`No stories found in ${base}/index.json`);
    }

    browser = await chromium.launch();
    let failed = 0;

    for (const id of storyIds) {
      const problems = await checkStory(browser, base, id);
      if (problems.length === 0) {
        console.log(`✓ ${id}`);
      } else {
        failed++;
        console.log(`✗ ${id}: ${problems.join('; ')}`);
      }
    }

    console.log(`${storyIds.length - failed}/${storyIds.length} stories passed`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Storybook smoke test failed:', error);
    process.exitCode = 1;
  } finally {
    await browser?.close();
  }
}

async function fetchStoryIds(base) {
  const response = await fetch(`${base}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${base}/index.json: ${response.status} ${response.statusText}`);
  }
  const { entries } = await response.json();
  return Object.values(entries)
    .filter((entry) => entry.type === 'story')
    .map((entry) => entry.id);
}

async function checkStory(browser, base, id) {
  const page = await browser.newPage();
  const problems = [];

  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.log(`  console error in ${id}: ${message.text()}`);
    }
  });

  try {
    await page.goto(`${base}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`, {
      waitUntil: 'load',
    });
    const rendered = await page
      .waitForSelector(`${ROOT_SELECTOR} > *, body.${ERROR_DISPLAY_CLASS}`, {
        timeout: RENDER_TIMEOUT_MS,
      })
      .then(() => true)
      .catch(() => false);
    await page.waitForTimeout(SETTLE_TIMEOUT_MS);
    const showsError = await page.evaluate(
      (className) => document.body.classList.contains(className),
      ERROR_DISPLAY_CLASS,
    );
    if (showsError) {
      problems.push('storybook error display shown');
    } else if (!rendered) {
      problems.push(`empty ${ROOT_SELECTOR}`);
    }
  } catch (error) {
    problems.push(`check failed: ${error.message}`);
  } finally {
    await page.close();
  }

  return problems;
}
