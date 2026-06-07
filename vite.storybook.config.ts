import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import dotenv from 'dotenv-flow';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

dotenv.config({ silent: true });

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      alias: {
        $assets: resolve('./src/assets'),
        $lib: resolve('./src/lib'),
      },
      compilerOptions: {
        experimental: {
          async: true,
        },
      },
    }),
    SvelteKitPWA({
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
