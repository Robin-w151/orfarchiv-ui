<script lang="ts">
  import { getSourceLabel } from '$lib/models/settings';
  import { AccessibleTransitionStore } from '$lib/stores/runes/accessibleTransition.svelte';
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { getReducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import { getChapterTitle } from '$lib/utils/chapter';
  import { formatTimestamp } from '$lib/utils/datetime';
  import { rollUp } from '$lib/utils/transitions';
  import { runViewTransition } from '$lib/utils/viewTransition';
  import {
    ArrowsPointingOut,
    ArrowUturnLeft,
    Backward,
    ChevronDown,
    ChevronUp,
    Forward,
    Minus,
    Pause,
    PauseCircle,
    Play,
    PlayCircle,
    XMark,
  } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import Button from '../controls/Button.svelte';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';

  const audioStore = getAudioStore();
  const reducedMotionStore = getReducedMotionStore();
  const chapterListTransitionStore = new AccessibleTransitionStore(() => rollUp);
  const chapterListTransition = $derived(chapterListTransitionStore.accessibleTransition);

  let minimized = $state(false);
  let chaptersExpanded = $state(false);
  let sourceLabel = $derived(getSourceLabel(audioStore.story?.source));
  let chapters = $derived(audioStore.chapters);
  let hasChapters = $derived(chapters.length > 1);
  let segmentCounts = $derived(chapters.map((chapter) => chapter.segments.length || 1));
  let segmentCount = $derived(segmentCounts.reduce((count, chapterCount) => count + chapterCount, 0));
  let chapterFills = $derived(calculateChapterFills(segmentCounts, segmentCount, audioStore.progress));

  const wrapperClass = $derived(['fixed bottom-0 right-0 z-30 flex justify-end', !minimized && 'w-full sm:w-[32rem]']);
  const playerClass = [
    'flex flex-col gap-4 mx-6 my-4 p-4',
    'w-full',
    'bg-gray-100/90 dark:bg-gray-600/80',
    'rounded-xl shadow-md backdrop-blur-md',
  ];
  const minimizedPlayerClass = [
    'flex gap-2 m-1 p-3',
    'bg-gray-100/90 dark:bg-gray-600/80',
    'rounded-md shadow-md backdrop-blur-xs',
  ];
  const windowActionsClass = ['flex justify-end gap-2'];
  const chaptersClass = ['flex flex-col gap-2'];
  const chaptersHeaderClass = ['flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300'];
  const chaptersHeaderTitleClass = ['flex-1 truncate text-left'];
  const chaptersProgressClass = ['flex items-center gap-1 w-full'];
  const chaptersProgressTrackClasses = [
    'block w-full bg-gray-300 dark:bg-gray-500 rounded-sm',
    'group-focus-visible:outline-solid group-focus-visible:outline-(length:--oa-outline-width) outline-offset-2',
    'outline-(--oa-outline-color-light) dark:outline-(--oa-outline-color-dark)',
  ];
  const chaptersProgressFillClass = ['block h-full bg-gray-700 dark:bg-gray-200 rounded-sm'];
  const chaptersListClass = [
    'flex flex-col items-stretch gap-1 p-1 max-h-40 overflow-y-auto',
    'bg-gray-300/80 dark:bg-gray-800/60',
    'rounded-sm',
  ];
  const titleClass = ['flex flex-col flex-1 items-start'];
  const metadataClass = ['flex flex-wrap items-center gap-x-1 text-sm text-gray-600 dark:text-gray-300'];
  const controlsClass = ['flex justify-center gap-2'];

  function handleToggleMinimized(): void {
    runViewTransition(
      () => {
        minimized = !minimized;
      },
      { useReducedMotion: reducedMotionStore.useReducedMotion },
    );
  }

  function handleClose(): void {
    audioStore.end();
    minimized = false;
    chaptersExpanded = false;
  }

  function handleToggleChapters(): void {
    chaptersExpanded = !chaptersExpanded;
  }

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

{#if audioStore.isActive}
  <AccessibleTransition class={wrapperClass}>
    {#if minimized}
      <div class={minimizedPlayerClass} style="view-transition-name: audio-player">
        {#if audioStore.isPlaying}
          <Button class="w-fit" btnType="monochrome" iconOnly round title="Pausieren" onclick={audioStore.pause}>
            <Icon src={PauseCircle} theme="outlined" class="size-6" />
          </Button>
        {:else}
          <Button class="w-fit" btnType="monochrome" iconOnly round title="Vorlesen" onclick={audioStore.play}>
            <Icon src={PlayCircle} theme="outlined" class="size-6" />
          </Button>
        {/if}
        <Button btnType="monochrome" iconOnly round title="Maximieren" onclick={handleToggleMinimized}>
          <Icon src={ArrowsPointingOut} theme="outlined" class="size-6" />
        </Button>
        <Button btnType="monochrome" iconOnly round title="Schließen" onclick={handleClose}>
          <Icon src={XMark} theme="outlined" class="size-6" />
        </Button>
      </div>
    {:else}
      <section class={playerClass} style="view-transition-name: audio-player">
        <div class={windowActionsClass}>
          <Button btnType="monochrome" iconOnly round title="Minimieren" onclick={handleToggleMinimized}>
            <Icon src={Minus} theme="outlined" class="size-6" />
          </Button>
          <Button btnType="monochrome" iconOnly round title="Schließen" onclick={handleClose}>
            <Icon src={XMark} theme="outlined" class="size-6" />
          </Button>
        </div>
        {#if audioStore.story}
          {@const story = audioStore.story}
          <div class={titleClass}>
            <h3>
              <span>{story.title}</span>
            </h3>
            <span class={metadataClass}>
              <span>{story.category ?? 'Keine Kategorie'}</span>
              {#if sourceLabel}
                <span>({sourceLabel})</span>
              {/if}
              <span>{formatTimestamp(story.timestamp)}</span></span
            >
          </div>
        {/if}
        {#if hasChapters}
          <hr class="border-gray-400" />
          <section class={chaptersClass}>
            <div class={chaptersHeaderClass}>
              <span class={chaptersHeaderTitleClass}>
                Kapitel {audioStore.chapterIndex + 1}/{chapters.length} · {getChapterTitle(
                  chapters[audioStore.chapterIndex],
                  audioStore.chapterIndex,
                  audioStore.story?.title,
                )}
              </span>
              <Button
                btnType="monochrome"
                iconOnly
                round
                title={chaptersExpanded ? 'Kapitel ausblenden' : 'Kapitel anzeigen'}
                onclick={handleToggleChapters}
              >
                <Icon src={chaptersExpanded ? ChevronUp : ChevronDown} theme="outlined" class="size-6" />
              </Button>
            </div>
            <div class={chaptersProgressClass} role="group" aria-label="Kapitel">
              {#each chapters as chapter, index (index)}
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
            {#if chaptersExpanded}
              <ol
                class={chaptersListClass}
                transition:chapterListTransition={chapterListTransitionStore.accessibleTransitionProps}
              >
                {#each chapters as chapter, index (index)}
                  <li>
                    <Button
                      class="w-full justify-start text-left"
                      btnType="monochrome"
                      ariaCurrent={index === audioStore.chapterIndex}
                      onclick={() => audioStore.playChapter(index)}
                    >
                      <span class="truncate">{getChapterTitle(chapter, index, audioStore.story?.title)}</span>
                    </Button>
                  </li>
                {/each}
              </ol>
            {/if}
          </section>
        {/if}
        <hr class="border-gray-400" />
        <div class={controlsClass}>
          {#if hasChapters}
            <Button
              btnType="monochrome"
              size="large"
              iconOnly
              round
              title="Vorheriges Kapitel"
              onclick={audioStore.previousChapter}
            >
              <Icon src={Backward} theme="solid" class="size-8" />
            </Button>
          {/if}
          <Button
            class="w-fit"
            btnType="monochrome"
            size="large"
            iconOnly
            round
            title={audioStore.isPlaying ? 'Pausieren' : 'Vorlesen'}
            onclick={audioStore.isPlaying ? audioStore.pause : audioStore.play}
          >
            {#if audioStore.isPlaying}
              <Icon src={Pause} theme="solid" class="size-8" />
            {:else}
              <Icon src={Play} theme="solid" class="size-8" />
            {/if}
          </Button>
          {#if hasChapters}
            <Button
              btnType="monochrome"
              size="large"
              iconOnly
              round
              disabled={audioStore.chapterIndex >= chapters.length - 1}
              title="Nächstes Kapitel"
              onclick={audioStore.nextChapter}
            >
              <Icon src={Forward} theme="solid" class="size-8" />
            </Button>
          {/if}
          <Button
            btnType="monochrome"
            size="large"
            iconOnly
            round
            title="Vom Anfang"
            onclick={audioStore.playFromStart}
          >
            <Icon src={ArrowUturnLeft} theme="solid" class="size-8" />
          </Button>
        </div>
      </section>
    {/if}
  </AccessibleTransition>
{/if}

<style>
  :global(::view-transition-old(audio-player)),
  :global(::view-transition-new(audio-player)) {
    animation-duration: var(--oa-view-transition-duration);
    animation-timing-function: ease-out;
  }

  :global(::view-transition-old(audio-player)) {
    animation-name: oa-scale-out;
    transform-origin: bottom right;
  }

  :global(::view-transition-new(audio-player)) {
    animation-name: oa-scale-in;
    transform-origin: bottom right;
  }
</style>
