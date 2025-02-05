<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id?: string;
    children?: Snippet;
  }

  let { id, children }: Props = $props();

  const contentClass = 'flex flex-col gap-2 lg:gap-3 items-center';
</script>

<div class={contentClass} {id}>
  {@render children?.()}
</div>
