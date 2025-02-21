import { reducedMotionStore } from './reducedMotion.svelte';

export interface SkeletonStoreInterface {
  readonly skeletonAnimationClass: string;
}

function SkeletonStore(): SkeletonStoreInterface {
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
