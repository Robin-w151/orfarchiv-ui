import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import dotenv from 'dotenv-flow';
import type { UserConfig } from 'vite';

dotenv.config({ silent: true });

const config = {
  // define: {
  //   'import.meta.env.VERCEL_ANALYTICS_ID': JSON.stringify(process.env.VERCEL_ANALYTICS_ID),
  //   'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
  //   'process.env.NODE_ENV': '"production"',
  // },
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
