<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { Newspaper } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
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
      <Icon src={Newspaper} theme="outlined" class="size-6" />
    {:else}
      <span>Button</span>
    {/if}
  </Button>
</span>
