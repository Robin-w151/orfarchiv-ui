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

  transition = $state<Transition>(fade);
  transitionProps = $state<TransitionProps>(transitionDefaults);

  accessibleTransition = $derived(this.reducedMotionStore.useReducedMotion ? fade : this.transition);
  accessibleTransitionProps = $derived(
    this.reducedMotionStore.useReducedMotion || !this.transitionProps ? transitionDefaults : this.transitionProps,
  );

  constructor(transition: Transition, transitionProps?: TransitionProps) {
    this.transition = transition;
    this.transitionProps = transitionProps || transitionDefaults;
  }
}
