<script lang="ts">
  import Checkbox from '$lib/components/ui/controls/Checkbox.svelte';
  import SpinningDotsIndicator from '$lib/components/ui/loading/SpinningDotsIndicator.svelte';

  export let showLoadingIndicator = false;
  export let delay = 0;
</script>

<Checkbox
  id="show-loading-indicator-input"
  label="Show loading indicator"
  bind:checked={showLoadingIndicator}
  on:change
/>
{#if showLoadingIndicator}
  <SpinningDotsIndicator {delay} />
{/if}
