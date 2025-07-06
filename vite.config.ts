import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { execSync } from 'child_process';
import dotenv from 'dotenv-flow';
import Sonda from 'sonda/sveltekit';
import type { UserConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import manifest from './src/assets/manifest';

dotenv.config({ silent: true });

const config = {
  define: {
    'import.meta.env.VERCEL_ANALYTICS_ID': JSON.stringify(process.env.VERCEL_ANALYTICS_ID),
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
    'import.meta.env.APP_COMMIT_HASH': JSON.stringify(getCommitHash()),
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      strategies: 'injectManifest',
      manifest,
      minify: false,
      devOptions: {
        enabled: true,
        suppressWarnings: process.env.SUPPRESS_WARNING === 'true',
        type: 'module',
        navigateFallback: '/',
      },
    }),
    Sonda({ open: false }),
    devtoolsJson(),
  ],
  build: {
    sourcemap: true,
  },
  server: {
    port: 3001,
  },
  preview: {
    port: 3301,
  },
} satisfies UserConfig;

export default config;

function getCommitHash(): string | undefined {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.error('Failed to get git commit hash:', error);
  }
}
