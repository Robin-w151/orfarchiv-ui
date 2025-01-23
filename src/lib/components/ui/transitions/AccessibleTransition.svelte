<script lang="ts">
  import settings from '$lib/stores/settings';
  import { transitionDefaults, useReducedMotion } from '$lib/utils/transitions';
  import type { Snippet } from 'svelte';
  import { fade, type TransitionConfig } from 'svelte/transition';

  interface Props {
    transition?: (node: Element, props: any) => TransitionConfig;
    transitionProps?: TransitionConfig;
    onlyIn?: boolean;
    class?: string;
    children?: Snippet;
  }

  let { transition = fade, transitionProps, onlyIn = false, class: clazz, children }: Props = $props();

  let usedTransition = $derived(useReducedMotion() || $settings.forceReducedMotion ? fade : transition);
  let usedTransitionProps = $derived(
    useReducedMotion() || $settings.forceReducedMotion ? transitionDefaults : transitionProps,
  );
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
