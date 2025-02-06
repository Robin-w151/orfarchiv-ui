<script lang="ts">
  import type { Snippet } from 'svelte';
  import Item from './Item.svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<Item noColumn>
  {@render children?.()}
</Item>
