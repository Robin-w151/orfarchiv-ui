export default {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@vueless/storybook-dark-mode', '@storybook/addon-docs'],
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        viteConfigPath: 'vite.storybook.config.ts',
      },
    },
  },
  framework: {
    name: '@storybook/sveltekit',
    options: {},
  },
  docs: {
    docsPage: true,
  },
};
