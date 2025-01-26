import { MediaQuery } from 'svelte/reactivity';
import settings from '../settings';

class ReducedMotionStore {
  private prefersReducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  private forceReducedMotion = $state(false);
  useReducedMotion = $derived(this.forceReducedMotion || this.prefersReducedMotion.current);

  constructor() {
    settings.subscribe((settings) => {
      this.forceReducedMotion = settings.forceReducedMotion;
    });
  }
}

export const reducedMotionStore = new ReducedMotionStore();
