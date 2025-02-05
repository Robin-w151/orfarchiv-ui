<script lang="ts">
  import { reducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import { transitionDefaults } from '$lib/utils/transitions';
  import type { Snippet } from 'svelte';
  import { fade, type TransitionConfig } from 'svelte/transition';

  interface Props {
    transition?: (node: Element, props: any) => TransitionConfig;
    transitionProps?: TransitionConfig;
    onlyIn?: boolean;
    class?: string | string[];
    children?: Snippet;
  }

  let {
    transition = fade,
    transitionProps = transitionDefaults,
    onlyIn = false,
    class: clazz,
    children,
  }: Props = $props();

  let usedTransition = $derived(reducedMotionStore.useReducedMotion ? fade : transition);
  let usedTransitionProps = $derived(reducedMotionStore.useReducedMotion ? transitionDefaults : transitionProps);
</script>

{#if onlyIn}
  <div class={clazz} in:usedTransition|global={usedTransitionProps}>
    {@render children?.()}
  </div>
{:else}
  <div class={clazz} transition:usedTransition|global={usedTransitionProps}>
    {@render children?.()}
  </div>
{/if}
