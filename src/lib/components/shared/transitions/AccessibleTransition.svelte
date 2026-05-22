<script lang="ts" generics="TElement extends HTMLElement = HTMLDivElement">
  import { AccessibleTransitionStore } from '$lib/stores/runes/accessibleTransition.svelte';
  import { transitionDefaults } from '$lib/utils/transitions';
  import { type Snippet } from 'svelte';
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

  // svelte-ignore state_referenced_locally
  const accessibleTransitionStore = new AccessibleTransitionStore(transition, transitionProps);
</script>

{#if onlyIn}
  {@const usedTransition = accessibleTransitionStore.accessibleTransition}
  <svelte:element
    this={element}
    class={clazz}
    {style}
    {...restProps}
    in:usedTransition|global={accessibleTransitionStore.accessibleTransitionProps}
    bind:this={elementRef}
  >
    {@render children?.()}
  </svelte:element>
{:else}
  {@const usedTransition = accessibleTransitionStore.accessibleTransition}
  <svelte:element
    this={element}
    class={clazz}
    {style}
    {...restProps}
    transition:usedTransition|global={accessibleTransitionStore.accessibleTransitionProps}
    bind:this={elementRef}
  >
    {@render children?.()}
  </svelte:element>
{/if}
