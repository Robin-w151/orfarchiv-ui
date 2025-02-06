<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import NewspaperIcon from '$lib/components/shared/icons/outline/NewspaperIcon.svelte';
  import type { KeyboardEventHandler, MouseEventHandler } from 'svelte/elements';

  interface Props {
    onclick?: MouseEventHandler<HTMLButtonElement>;
    onkeydown?: KeyboardEventHandler<HTMLButtonElement>;
    [key: string]: any;
  }

  let { onclick, onkeydown, ...props }: Props = $props();
</script>

<span class="inline-block p-4 bg-white dark:bg-gray-900 rounded-md">
  <Button {...props} {onclick} {onkeydown}>
    {#if props['iconOnly']}
      <NewspaperIcon />
    {:else}
      <span>Button</span>
    {/if}
  </Button>
</span>
