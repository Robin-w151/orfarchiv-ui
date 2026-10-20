import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import dotenv from 'dotenv-flow';
import { defineConfig } from 'vite';

dotenv.config({ silent: true });

export default defineConfig({
  define: {
    __SVELTEKIT_PAYLOAD__: 'undefined',
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
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
