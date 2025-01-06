<script lang="ts">
  import { rollFade } from '$lib/utils/transitions';
  import type { Snippet } from 'svelte';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: clazz, children }: Props = $props();

  let contentClass: string = $derived(`
    bg-white dark:bg-gray-900/80 dark:backdrop-blur-sm
    rounded-lg shadow-md dark:shadow-2xl
    ${clazz}
  `);
</script>

<AccessibleTransition class={contentClass} transition={rollFade}>
  {@render children?.()}
</AccessibleTransition>
