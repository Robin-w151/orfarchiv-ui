import '../src/app.scss';
import './preview.scss';
import { setReducedMotionStore } from '../src/lib/stores/runes/reducedMotion.svelte';
import { setSkeletonStore } from '../src/lib/stores/runes/skeleton.svelte';
import { setAudioStore } from '../src/lib/stores/runes/audio.svelte';

const withSvelteStores = (storyFn) => {
  setReducedMotionStore();
  setSkeletonStore();
  setAudioStore();

  return storyFn();
};

export const decorators = [withSvelteStores];

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
