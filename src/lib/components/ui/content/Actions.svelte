<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  const actionsClass = 'flex justify-center gap-2 w-full';
</script>

<div class={actionsClass}>
  {@render children?.()}
</div>
