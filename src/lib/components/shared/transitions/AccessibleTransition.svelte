<script lang="ts">
  import { getReducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import { transitionDefaults } from '$lib/utils/transitions';
  import type { Snippet } from 'svelte';
  import { fade, type TransitionConfig } from 'svelte/transition';

  interface Props {
    transition?: (node: Element, props: any) => TransitionConfig;
    transitionProps?: TransitionConfig;
    onlyIn?: boolean;
    class?: string | (string | undefined)[];
    children?: Snippet;
    [key: string]: any;
  }

  let {
    transition = fade,
    transitionProps = transitionDefaults,
    onlyIn = false,
    class: clazz,
    children,
    ...restProps
  }: Props = $props();

  const reducedMotionStore = getReducedMotionStore();

  let usedTransition = $derived(reducedMotionStore.useReducedMotion ? fade : transition);
  let usedTransitionProps = $derived(reducedMotionStore.useReducedMotion ? transitionDefaults : transitionProps);
</script>

{#if onlyIn}
  <div class={clazz} in:usedTransition|global={usedTransitionProps} {...restProps}>
    {@render children?.()}
  </div>
{:else}
  <div class={clazz} transition:usedTransition|global={usedTransitionProps} {...restProps}>
    {@render children?.()}
  </div>
{/if}
