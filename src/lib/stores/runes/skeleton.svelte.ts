import { getContext, setContext } from 'svelte';
import { getReducedMotionStore } from './reducedMotion.svelte';

export interface SkeletonStoreInterface {
  readonly skeletonAnimationClass: string;
}

class SkeletonStore implements SkeletonStoreInterface {
  private reducedMotionStore = getReducedMotionStore();

  readonly skeletonAnimationClass = $derived(
    this.reducedMotionStore.useReducedMotion ? 'skeleton-animation-pulse' : 'skeleton-animation-fly',
  );
}

const DEFAULT_KEY = Symbol('root_skeleton_store');

export function getSkeletonStore(key: symbol = DEFAULT_KEY): SkeletonStoreInterface {
  return getContext(key);
}

export function setSkeletonStore(key: symbol = DEFAULT_KEY): SkeletonStoreInterface {
  const skeletonStore = new SkeletonStore();
  return setContext(key, skeletonStore);
}
