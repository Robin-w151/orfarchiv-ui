import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig({
  ...viteConfig,
  test: {
    include: ['src/**/*.spec.ts'],
    env: { NODE_ENV: 'test' },
    environment: 'node',
  },
});
