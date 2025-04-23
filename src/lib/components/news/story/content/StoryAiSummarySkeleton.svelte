<script lang="ts">
  import { skeletonStore } from '$lib/stores/runes/skeleton.svelte';

  const aiSummaryLoadingBarClass = 'bg-gray-300 dark:bg-gray-600 rounded-sm';
  let skeletonAnimationClass = $derived(skeletonStore.skeletonAnimationClass);
</script>

<div class="flex flex-col my-4">
  {#each { length: 8 }}
    <span class="summary-skeleton {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></span>
  {/each}
</div>

<style>
  .summary-skeleton {
    margin: 0.25rem 0;
    width: 100%;
    height: 16px;

    &:nth-child(1) {
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      width: 70%;
    }

    &:nth-child(2) {
      margin: 1rem 0 0.75rem;
      width: 60%;
      height: 1.25rem;
    }

    &:nth-child(3) {
      margin-top: 1rem;
      margin-left: 2rem;
      width: 50%;
    }

    &:nth-child(4) {
      margin-left: 2rem;
      width: 55%;
    }

    &:nth-child(5) {
      margin-bottom: 1rem;
      margin-left: 2rem;
      width: 45%;
    }

    &:nth-child(6) {
      width: 80%;
    }

    &:nth-child(7) {
      width: 95%;
    }

    &:nth-child(8) {
      width: 85%;
    }
  }
</style>
