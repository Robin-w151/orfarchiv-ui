import '../src/app.css';
import './preview.css';
import StorybookStoreDecorator from './StorybookStoreDecorator.svelte';

export const decorators = [
  () => ({
    Component: StorybookStoreDecorator,
  }),
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  darkMode: {
    stylePreview: true,
    classTarget: 'html',
  },
};
