<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    children?: Snippet;
  }

  let { label, children }: Props = $props();
</script>

<label class="flex flex-col gap-1">
  <span>{label}</span>
  {@render children?.()}
</label>
