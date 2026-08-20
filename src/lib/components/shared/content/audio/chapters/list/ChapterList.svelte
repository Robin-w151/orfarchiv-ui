<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { AccessibleTransitionStore } from '$lib/stores/runes/accessibleTransition.svelte';
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { getChapterTitle } from '$lib/utils/chapter';
  import { rollUp } from '$lib/utils/transitions';

  const audioStore = getAudioStore();

  const chapters = $derived(audioStore.chapters);

  const chapterListTransitionStore = new AccessibleTransitionStore(() => rollUp);
  const chapterListTransition = $derived(chapterListTransitionStore.accessibleTransition);

  const chapterListClass = [
    'flex flex-col items-stretch gap-1 p-2 max-h-40 sm:max-h-64',
    'bg-gray-300/80 dark:bg-gray-800/60',
    'rounded-md',
    'overflow-y-auto overscroll-contain',
  ];
  const chapterButtonClass = ['w-full justify-start text-left'];
</script>

<ol class={chapterListClass} transition:chapterListTransition={chapterListTransitionStore.accessibleTransitionProps}>
  {#each chapters as chapter, index (index)}
    <li>
      <Button
        class={chapterButtonClass}
        btnType="monochrome"
        ariaCurrent={index === audioStore.chapterIndex}
        onclick={() => audioStore.playChapter(index)}
      >
        <span class="truncate">{getChapterTitle(chapter, index, audioStore.story?.title)}</span>
      </Button>
    </li>
  {/each}
</ol>
