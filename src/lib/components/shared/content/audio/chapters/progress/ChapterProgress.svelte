<script lang="ts">
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { getReducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import { getChapterTitle } from '$lib/utils/chapter';

  const audioStore = getAudioStore();
  const reducedMotionStore = getReducedMotionStore();

  const chapterLengths = $derived.by(() => {
    return audioStore.chapters.map((chapter) => {
      return chapter.segments.reduce((chapterLength, segment) => chapterLength + segment.length, 0);
    });
  });

  const chapterProgressClass = ['flex items-center gap-1 w-full h-8'];
  const chapterProgressButtonClass = [
    'progress-button group',
    'flex-1 min-w-2 py-2 -my-2',
    'cursor-pointer focus-visible:outline-hidden',
  ];
  const chapterProgressTrackClass = [
    'progress-track',
    'block w-full h-2.5 hover:h-4 hover:rounded-sm',
    'bg-gray-300 dark:bg-gray-500',
    'group-focus-visible:outline-solid group-focus-visible:outline-(length:--oa-outline-width)',
    'outline-offset-2 outline-(--oa-outline-color-light) dark:outline-(--oa-outline-color-dark)',
    'overflow-hidden transition-all duration-(--oa-transition-duration)',
  ];
  const chapterProgressFillClass = ['block h-full bg-gray-700 dark:bg-gray-200'];
</script>

<div class={chapterProgressClass} role="group" aria-label="Kapitel">
  {#each audioStore.chapters as chapter, index (index)}
    <button
      type="button"
      class={chapterProgressButtonClass}
      style="flex-grow: {chapterLengths[index]}"
      aria-label={getChapterTitle(chapter, index, audioStore.story?.title)}
      aria-current={index === audioStore.chapterIndex ? 'true' : undefined}
      onclick={() => audioStore.playChapter(index)}
    >
      <span class={chapterProgressTrackClass}>
        <span
          class={[
            ...chapterProgressFillClass,
            index === audioStore.chapterIndex && 'chapter-fill-animation',
            reducedMotionStore.useReducedMotion && 'reduced-motion',
          ]}
          style:width={index < audioStore.chapterIndex ? '100%' : '0%'}
          style:animation-play-state={audioStore.isPlaying ? 'running' : 'paused'}
        ></span>
      </span>
    </button>
  {/each}
</div>

<style lang="postcss">
  @reference "tailwindcss";

  .progress-button:first-child > .progress-track {
    @apply rounded-l-sm;
  }

  .progress-button:last-child > .progress-track {
    @apply rounded-r-sm;
  }

  .chapter-fill-animation {
    &.reduced-motion {
      animation: chapter-fill-reduced-motion 1.5s ease-in-out infinite alternate;
    }

    &:not(.reduced-motion) {
      animation: chapter-fill 3s ease-out infinite;
    }
  }

  @keyframes chapter-fill {
    from {
      width: 0%;
      opacity: 0.1;
    }
    to {
      width: 100%;
      opacity: 0.7;
    }
  }

  @keyframes chapter-fill-reduced-motion {
    from {
      width: 100%;
      opacity: 0.1;
    }
    to {
      width: 100%;
      opacity: 0.7;
    }
  }
</style>
