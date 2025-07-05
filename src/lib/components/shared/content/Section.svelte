<script lang="ts">
  import { defaultPadding } from '$lib/utils/styles';
  import ConicGradientSpinner from '$lib/components/shared/loading/ConicGradientSpinner.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    isLoading?: boolean;
    class?: string;
    children?: Snippet;
  }

  let { title, isLoading = false, class: clazz, children }: Props = $props();

  const sectionClass = `
    flex flex-col items-center
    w-full
    bg-white dark:bg-gray-900
    overflow-clip
    ${clazz}
  `;
  const headerClass = `
    flex gap-2 justify-center items-center sticky top-0 z-20
    ${defaultPadding}
    w-full h-12 sm:h-[54px] text-lg
    text-blue-700 dark:text-blue-500 bg-white/80 dark:bg-gray-900/80
    border-solid border-b-2 border-gray-200 dark:border-gray-700
    backdrop-blur-xs
  `;
  const contentClass = 'w-full';
</script>

<section class={sectionClass}>
  {#if title}
    <header class={headerClass}>
      {#if isLoading}
        <ConicGradientSpinner />
      {:else}
        <h2>{title}</h2>
      {/if}
    </header>
  {/if}
  <div class={contentClass}>
    {@render children?.()}
  </div>
</section>
