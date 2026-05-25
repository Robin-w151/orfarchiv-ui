import { fade, type TransitionConfig } from 'svelte/transition';
import { getReducedMotionStore } from './reducedMotion.svelte';
import { transitionDefaults } from '$lib/utils/transitions';

export type Transition = (node: Element, props: any) => TransitionConfig;
export type TransitionProps = TransitionConfig;

export interface AccessibleTransitionStoreInterface {
  accessibleTransition: Transition;
  accessibleTransitionProps: TransitionProps;
}

export class AccessibleTransitionStore implements AccessibleTransitionStoreInterface {
  private reducedMotionStore = getReducedMotionStore();
  private transition: () => Transition;
  private transitionProps: () => TransitionProps;

  accessibleTransition: Transition;
  accessibleTransitionProps: TransitionProps;

  constructor(transition: () => Transition, transitionProps: () => TransitionProps = () => transitionDefaults) {
    this.transition = transition;
    this.transitionProps = transitionProps;

    this.accessibleTransition = $derived.by(() =>
      this.reducedMotionStore.useReducedMotion ? fade : this.transition(),
    );
    this.accessibleTransitionProps = $derived.by(() => {
      if (this.reducedMotionStore.useReducedMotion) {
        return transitionDefaults;
      }

      return this.transitionProps() ?? transitionDefaults;
    });
  }
}
