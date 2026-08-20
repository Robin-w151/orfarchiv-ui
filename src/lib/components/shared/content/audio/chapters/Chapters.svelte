<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { getChapterTitle } from '$lib/utils/chapter';
  import { ChevronDown, ChevronUp } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import ChapterList from './list/ChapterList.svelte';
  import ChapterProgress from './progress/ChapterProgress.svelte';

  const audioStore = getAudioStore();

  const chaptersClass = ['flex flex-col gap-2'];
  const chaptersHeaderClass = ['flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300'];
  const chaptersHeaderTitleClass = ['flex-1 truncate text-left'];

  function handleToggleChapters(): void {
    audioStore.chaptersExpanded = !audioStore.chaptersExpanded;
  }
</script>

{#if audioStore.hasChapters}
  <hr class="border-gray-400" />
  <section class={chaptersClass}>
    <div class={chaptersHeaderClass}>
      <span class={chaptersHeaderTitleClass}>
        Kapitel {audioStore.chapterIndex + 1}/{audioStore.chapters.length} · {getChapterTitle(
          audioStore.chapters[audioStore.chapterIndex],
          audioStore.chapterIndex,
          audioStore.story?.title,
        )}
      </span>
      <Button
        btnType="monochrome"
        iconOnly
        round
        title={audioStore.chaptersExpanded ? 'Kapitel ausblenden' : 'Kapitel anzeigen'}
        onclick={handleToggleChapters}
      >
        <Icon src={audioStore.chaptersExpanded ? ChevronUp : ChevronDown} theme="outlined" class="size-6" />
      </Button>
    </div>
    <ChapterProgress />
    {#if audioStore.chaptersExpanded}
      <ChapterList />
    {/if}
  </section>
{/if}
