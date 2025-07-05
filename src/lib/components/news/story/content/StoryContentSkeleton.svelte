<script lang="ts">
  import { getSkeletonStore } from '$lib/stores/runes/skeleton.svelte';

  const skeletonStore = getSkeletonStore();

  const contentSkeletonClass = 'content-skeleton flex flex-col items-start w-full';
  const contentSkeletonBarClass = 'bg-gray-300 dark:bg-gray-600 rounded-xs';
  const skeletonAnimationClass = $derived(skeletonStore.skeletonAnimationClass);
</script>

<div class={contentSkeletonClass} data-testid="story-content-skeleton">
  {#each { length: 8 }}
    <span class="{contentSkeletonBarClass} {skeletonAnimationClass}"></span>
  {/each}
</div>

<style>
  .content-skeleton {
    span {
      height: 16px;
      margin: 4px 0;
    }

    span:nth-child(1) {
      margin: calc(4px + 0.5rem) 0;
      width: 30%;
    }
    span:nth-child(2) {
      width: 93%;
    }
    span:nth-child(3) {
      width: 85%;
    }
    span:nth-child(4) {
      margin-bottom: calc(4px + 0.5rem);
      width: 90%;
    }
    span:nth-child(5) {
      margin-bottom: calc(4px + 0.5rem);
      width: 40%;
    }
    span:nth-child(6) {
      width: 92%;
    }
    span:nth-child(7) {
      width: 96%;
    }
    span:nth-child(8) {
      margin-bottom: calc(4px + 0.5rem);
      width: 88%;
    }
  }
</style>
