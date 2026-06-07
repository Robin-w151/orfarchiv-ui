import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import type { KitConfig } from '@sveltejs/kit';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import dotenv from 'dotenv-flow';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import Sonda from 'sonda/sveltekit';
import { defineConfig } from 'vite';
import cspConfig from './csp-config.js';
import manifest from './src/assets/manifest';

dotenv.config({ silent: true });

const useAdapterNode = process.env.USE_ADAPTER_NODE === 'true';
const isCspDisabled = process.env.DISABLE_CSP === 'true';

const adapter = useAdapterNode ? adapterNode() : adapterVercel();
const csp = (isCspDisabled ? undefined : cspConfig) as KitConfig['csp'];

export default defineConfig({
  define: {
    'import.meta.env.VERCEL_ANALYTICS_ID': JSON.stringify(process.env.VERCEL_ANALYTICS_ID),
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
    'import.meta.env.APP_COMMIT_HASH': JSON.stringify(getCommitHash()),
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter,
      alias: {
        $assets: resolve('./src/assets'),
        $lib: resolve('./src/lib'),
      },
      csp,
      compilerOptions: {
        experimental: {
          async: true,
        },
      },
    }),
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
});

function getCommitHash(): string | undefined {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.error('Failed to get git commit hash:', error);
  }
}
