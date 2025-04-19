<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    class?: string;
    for?: string;
    children?: Snippet;
  }

  let { label, class: clazz, for: htmlFor, children }: Props = $props();
</script>

<label class="flex flex-col gap-1 {clazz ?? ''}" for={htmlFor}>
  <span>{label}</span>
  {@render children?.()}
</label>
