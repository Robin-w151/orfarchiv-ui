<script lang="ts">
  import { focusTrap } from '$lib/utils/focusTrap';
  import { scaleFade, type TransformOrigin } from '$lib/utils/transitions';
  import type { Snippet } from 'svelte';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';

  interface Props {
    class?: string;
    transformOrigin?: TransformOrigin;
    children?: Snippet;
  }

  let { class: clazz, transformOrigin = 'center', children }: Props = $props();

  const contentClass = $derived([
    'bg-white dark:bg-gray-900/80 dark:backdrop-blur-xs',
    'rounded-lg shadow-md dark:shadow-2xl',
    clazz,
  ]);
</script>

<AccessibleTransition
  class={contentClass}
  style={`transform-origin: ${transformOrigin}`}
  transition={scaleFade}
  {@attach focusTrap({ skipInitialFocus: true })}
>
  {@render children?.()}
</AccessibleTransition>
