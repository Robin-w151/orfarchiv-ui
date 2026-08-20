<script lang="ts">
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { getChapterTitle } from '$lib/utils/chapter';

  const audioStore = getAudioStore();

  const segmentCounts = $derived(audioStore.chapters.map((chapter) => chapter.segments.length || 1));
  const segmentCount = $derived(segmentCounts.reduce((count, chapterCount) => count + chapterCount, 0));
  const chapterFills = $derived(calculateChapterFills(segmentCounts, segmentCount, audioStore.progress));

  const chaptersProgressClass = ['flex items-center gap-1 w-full'];
  const chaptersProgressTrackClasses = [
    'block w-full bg-gray-300 dark:bg-gray-500 rounded-full',
    'group-focus-visible:outline-solid group-focus-visible:outline-(length:--oa-outline-width) outline-offset-2',
    'outline-(--oa-outline-color-light) dark:outline-(--oa-outline-color-dark)',
  ];
  const chaptersProgressFillClass = ['block h-full bg-gray-700 dark:bg-gray-200 rounded-full'];

  function calculateChapterFills(counts: Array<number>, total: number, progress: number): Array<number> {
    if (!total) {
      return counts.map(() => 0);
    }

    const playedSegments = progress * total;
    let start = 0;
    return counts.map((count) => {
      const fill = Math.min(Math.max((playedSegments - start) / count, 0), 1);
      start += count;
      return fill;
    });
  }

  function chapterCellClass(index: number): string {
    const isActive = index === audioStore.chapterIndex;
    return [
      'group flex-1 min-w-2 py-2 -my-2 cursor-pointer',
      'focus-visible:outline-hidden',
      isActive ? 'opacity-100' : 'opacity-80',
    ].join(' ');
  }
</script>

<div class={chaptersProgressClass} role="group" aria-label="Kapitel">
  {#each audioStore.chapters as chapter, index (index)}
    <button
      type="button"
      class={chapterCellClass(index)}
      style="flex-grow: {segmentCounts[index]}"
      aria-label={getChapterTitle(chapter, index, audioStore.story?.title)}
      aria-current={index === audioStore.chapterIndex ? 'true' : undefined}
      onclick={() => audioStore.playChapter(index)}
    >
      <span class={[...chaptersProgressTrackClasses, index <= audioStore.chapterIndex ? 'h-4' : 'h-2.5']}>
        <span class={chaptersProgressFillClass} style="width: {chapterFills[index] * 100}%"></span>
      </span>
    </button>
  {/each}
</div>
