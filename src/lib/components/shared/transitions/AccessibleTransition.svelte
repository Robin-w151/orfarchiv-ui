<script lang="ts" generics="TElement extends HTMLElement = HTMLDivElement">
  import { AccessibleTransitionStore } from '$lib/stores/runes/accessibleTransition.svelte';
  import { transitionDefaults } from '$lib/utils/transitions';
  import type { Snippet } from 'svelte';
  import { type SvelteHTMLElements } from 'svelte/elements';
  import { fade, type TransitionConfig } from 'svelte/transition';

  type Props = SvelteHTMLElements[TElement['tagName']] & {
    transition?: (node: Element, props: any) => TransitionConfig;
    transitionProps?: TransitionConfig;
    onlyIn?: boolean;
    class?: string | (string | undefined)[];
    style?: string;
    element?: TElement['tagName'];
    elementRef?: TElement;
    children?: Snippet;
    [key: string]: any;
  };

  let {
    transition = fade,
    transitionProps = transitionDefaults,
    onlyIn = false,
    class: clazz,
    style,
    element = 'div',
    elementRef = $bindable(),
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
  <svelte:element
    this={element}
    class={clazz}
    {style}
    in:usedTransition|global={usedTransitionProps}
    bind:this={elementRef}
    {...restProps}
  >
    {@render children?.()}
  </svelte:element>
{:else}
  <svelte:element
    this={element}
    class={clazz}
    {style}
    transition:usedTransition|global={usedTransitionProps}
    bind:this={elementRef}
    {...restProps}
  >
    {@render children?.()}
  </svelte:element>
{/if}
