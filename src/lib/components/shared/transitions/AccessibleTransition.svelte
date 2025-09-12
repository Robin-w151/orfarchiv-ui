<script lang="ts">
  import { AccessibleTransitionStore } from '$lib/stores/runes/accessibleTransition.svelte';
  import { transitionDefaults } from '$lib/utils/transitions';
  import type { Snippet } from 'svelte';
  import { fade, type TransitionConfig } from 'svelte/transition';

  interface Props {
    transition?: (node: Element, props: any) => TransitionConfig;
    transitionProps?: TransitionConfig;
    onlyIn?: boolean;
    class?: string | (string | undefined)[];
    style?: string;
    children?: Snippet;
    [key: string]: any;
  }

  let {
    transition = fade,
    transitionProps = transitionDefaults,
    onlyIn = false,
    class: clazz,
    style,
    children,
    ...restProps
  }: Props = $props();

  const accessibleTransitionStore = new AccessibleTransitionStore(transition, transitionProps);

  $effect(() => {
    accessibleTransitionStore.transition = transition;
    accessibleTransitionStore.transitionProps = transitionProps;
  });

  let usedTransition = $derived(accessibleTransitionStore.accessibleTransition);
  let usedTransitionProps = $derived(accessibleTransitionStore.accessibleTransitionProps);
</script>

{#if onlyIn}
  <div class={clazz} {style} in:usedTransition|global={usedTransitionProps} {...restProps}>
    {@render children?.()}
  </div>
{:else}
  <div class={clazz} {style} transition:usedTransition|global={usedTransitionProps} {...restProps}>
    {@render children?.()}
  </div>
{/if}
