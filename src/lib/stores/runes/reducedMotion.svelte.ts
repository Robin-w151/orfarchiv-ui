import { getContext, setContext } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';
import settings from '../settings';

export interface ReducedMotionStoreInterface {
  useReducedMotion: boolean;
}

class ReducedMotionStore implements ReducedMotionStoreInterface {
  private prefersReducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  private forceReducedMotion = $state(false);

  useReducedMotion = $derived(this.forceReducedMotion || this.prefersReducedMotion.current);

  constructor() {
    settings.subscribe((settings) => {
      this.forceReducedMotion = settings.forceReducedMotion;
    });
  }
}

const DEFAULT_KEY = Symbol('root_reduced_motion_store');

export function getReducedMotionStore(key: symbol = DEFAULT_KEY): ReducedMotionStoreInterface {
  return getContext(key);
}

export function setReducedMotionStore(key: symbol = DEFAULT_KEY): ReducedMotionStoreInterface {
  const reducedMotionStore = new ReducedMotionStore();
  return setContext(key, reducedMotionStore);
}
