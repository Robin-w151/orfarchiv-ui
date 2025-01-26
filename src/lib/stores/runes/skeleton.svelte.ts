import { reducedMotionStore } from './reducedMotion.svelte';

class SkeletonStore {
  skeletonAnimationClass = $derived(
    reducedMotionStore.useReducedMotion ? 'skeleton-animation-pulse' : 'skeleton-animation-fly',
  );

  constructor() {}
}

export const skeletonStore = new SkeletonStore();
