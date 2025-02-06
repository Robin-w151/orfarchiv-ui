<script lang="ts">
  import Checkbox from '$lib/components/shared/controls/Checkbox.svelte';
  import SpinningDotsIndicator from '$lib/components/shared/loading/SpinningDotsIndicator.svelte';
  import type { ChangeEventHandler } from 'svelte/elements';

  interface Props {
    showLoadingIndicator?: boolean;
    delay?: number;
    onchange?: ChangeEventHandler<HTMLInputElement>;
  }

  let { showLoadingIndicator = $bindable(false), delay = 0, onchange }: Props = $props();
</script>

<Checkbox
  id="show-loading-indicator-input"
  label="Show loading indicator"
  bind:checked={showLoadingIndicator}
  {onchange}
/>
{#if showLoadingIndicator}
  <SpinningDotsIndicator {delay} />
{/if}
