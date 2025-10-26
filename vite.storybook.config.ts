import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import dotenv from 'dotenv-flow';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

dotenv.config({ silent: true });

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      devOptions: {
        enabled: false,
      },
    }),
    devtoolsJson(),
  ],
});
