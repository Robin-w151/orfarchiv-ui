<script lang="ts">
  import { skeletonStore } from '$lib/stores/runes/skeleton.svelte';

  const aiSummaryLoadingBarClass = 'bg-gray-300 dark:bg-gray-600 rounded-sm';
  let skeletonAnimationClass = $derived(skeletonStore.skeletonAnimationClass);
</script>

<div class="story-content">
  <div class="mt-2 mb-1 w-[80%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[90%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[85%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
</div>
