<script lang="ts">
  import { getSkeletonStore } from '$lib/stores/runes/skeleton.svelte';

  const skeletonStore = getSkeletonStore();

  const aiSummaryLoadingBarClass = 'bg-gray-300 dark:bg-gray-600 rounded-sm';
  const skeletonAnimationClass = $derived(skeletonStore.skeletonAnimationClass);
</script>

<div class="story-content">
  <!-- model info -->
  <div class="my-4 w-[40%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <!-- title -->
  <div class="mt-4 mb-3 w-[55%] h-7 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <!-- subtitle 1 -->
  <div class="mt-3 mb-2 w-[35%] h-6 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="mt-2 mb-1 w-[80%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[90%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[85%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <!-- subtitle 2 -->
  <div class="mt-3 mb-2 w-[45%] h-6 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="mt-2 mb-1 w-[85%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[95%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[80%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <!-- subtitle 3 -->
  <div class="mt-3 mb-2 w-[40%] h-6 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="mt-2 mb-1 w-[75%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[80%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
  <div class="my-1 w-[65%] h-4 {aiSummaryLoadingBarClass} {skeletonAnimationClass}"></div>
</div>
