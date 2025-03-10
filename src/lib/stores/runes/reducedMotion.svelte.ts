import { MediaQuery } from 'svelte/reactivity';
import settings from '../settings';

interface ReducedMotionStore {
  useReducedMotion: boolean;
}

function ReducedMotionStore(): ReducedMotionStore {
  const prefersReducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  let forceReducedMotion = $state(false);

  const useReducedMotion = $derived(forceReducedMotion || prefersReducedMotion.current);

  settings.subscribe((settings) => {
    forceReducedMotion = settings.forceReducedMotion;
  });

  return {
    get useReducedMotion() {
      return useReducedMotion;
    },
  };
}

export const reducedMotionStore = ReducedMotionStore();
