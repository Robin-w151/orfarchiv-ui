<script lang="ts">
  import { skeletonStore } from '$lib/stores/runes/skeleton.svelte';

  const aiSummaryLoadingBarClass = 'bg-gray-300 dark:bg-gray-600 rounded-sm';
  let skeletonAnimationClass = $derived(skeletonStore.skeletonAnimationClass);
</script>

<div class="flex flex-col my-4">
  {#each { length: 3 }}
    <span class="summary-skeleton {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></span>
  {/each}
</div>

<style>
  .summary-skeleton {
    height: 16px;
    margin: 4px 0;
    width: 100%;

    &:nth-child(1) {
      width: 85%;
    }

    &:nth-child(3) {
      width: 95%;
    }
  }
</style>
