<script lang="ts">
  import { focusTrap } from '$lib/utils/focusTrap';
  import { rollFade } from '$lib/utils/transitions';
  import type { Snippet } from 'svelte';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: clazz, children }: Props = $props();

  let contentClass: string = $derived(`
    bg-white dark:bg-gray-900/80 dark:backdrop-blur-xs
    rounded-lg shadow-md dark:shadow-2xl
    ${clazz}
  `);
</script>

<AccessibleTransition class={contentClass} transition={rollFade} {@attach focusTrap({ skipInitialFocus: true })}>
  {@render children?.()}
</AccessibleTransition>
