<script lang="ts">
  import clsx from 'clsx';
  import type { Snippet } from 'svelte';

  interface Props {
    fromColorClass?: string;
    toColorClass?: string;
    children?: Snippet;
  }

  let {
    fromColorClass = 'from-fuchsia-600 dark:from-fuchsia-400',
    toColorClass = 'to-blue-700 dark:to-blue-500',
    children,
  }: Props = $props();

  const textClass = `
    text-transparent bg-gradient-to-r bg-clip-text
  `;
  const textClass$ = clsx([fromColorClass, toColorClass]);
</script>

<span class="{textClass} {textClass$}">
  {@render children?.()}
</span>
