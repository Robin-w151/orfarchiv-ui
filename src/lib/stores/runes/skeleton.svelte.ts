import { reducedMotionStore } from './reducedMotion.svelte';

function SkeletonStore() {
  const skeletonAnimationClass = $derived(
    reducedMotionStore.useReducedMotion ? 'skeleton-animation-pulse' : 'skeleton-animation-fly',
  );

  return {
    get skeletonAnimationClass() {
      return skeletonAnimationClass;
    },
  };
}

export const skeletonStore = SkeletonStore();
