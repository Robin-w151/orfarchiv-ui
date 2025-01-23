<script lang="ts">
  import clsx from 'clsx';
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: clazz, children }: Props = $props();

  const listClass = clsx([
    'w-full',
    'bg-white dark:bg-gray-900',
    'divide-y-2 divide-solid divide-gray-200 dark:divide-gray-700',
    clazz,
  ]);
</script>

<ul class={listClass}>
  {@render children?.()}
</ul>
