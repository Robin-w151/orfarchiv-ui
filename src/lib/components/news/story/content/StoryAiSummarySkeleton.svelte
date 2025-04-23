<script lang="ts">
  import { skeletonStore } from '$lib/stores/runes/skeleton.svelte';

  const aiSummaryLoadingBarClass = 'bg-gray-300 dark:bg-gray-600 rounded-sm';
  let skeletonAnimationClass = $derived(skeletonStore.skeletonAnimationClass);
</script>

<div class="story-content">
  <div class="my-2 w-[70%] h-3 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="mt-4 mb-3 w-[55%] h-7 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="mt-4 mb-1 ml-8 w-[60%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 ml-8 w-[65%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="mt-1 mb-4 ml-8 w-[55%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="mt-3 mb-2 w-[40%] h-6 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="mt-2 mb-1 w-[80%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[90%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[85%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
</div>
