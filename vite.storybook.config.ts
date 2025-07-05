import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import dotenv from 'dotenv-flow';
import type { UserConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

dotenv.config({ silent: true });

const config = {
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
} satisfies UserConfig;

export default config;
