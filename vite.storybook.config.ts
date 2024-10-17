import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import dotenv from 'dotenv-flow';
import type { UserConfig } from 'vite';

dotenv.config({ silent: true });

const config = {
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      devOptions: {
        enabled: false,
      },
    }),
  ],
} satisfies UserConfig;

export default config;
