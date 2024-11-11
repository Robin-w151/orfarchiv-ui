<script lang="ts">
  import { fetchContent } from '$lib/api/news';
  import Button from '$lib/components/ui/controls/Button.svelte';
  import Link from '$lib/components/ui/controls/Link.svelte';
  import ChevronUpIcon from '$lib/components/ui/icons/outline/ChevronUpIcon.svelte';
  import { STORY_CONTENT_FETCH_MAX_RETRIES } from '$lib/configs/client';
  import { getSourceLabel } from '$lib/models/settings';
  import type { Story, StoryContent, StoryImage } from '$lib/models/story';
  import bookmarks from '$lib/stores/bookmarks';
  import settings from '$lib/stores/settings';
  import { wait } from '$lib/utils/wait';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import StoryContentSkeleton from './StoryContentSkeleton.svelte';
  import contentStore from '$lib/stores/content';
  import StoryImageViewer from './StoryImageViewer.svelte';

  export let story: Story;

  const dispatch = createEventDispatcher();

  const wrapperClass = 'flex flex-col items-center gap-3';
  const contentClass = 'cursor-auto w-full';
  const contentInfoClass = 'text-sm text-gray-500 dark:text-gray-400';
  const errorLinkClass = 'text-blue-700';
  const collapseContentClass = 'py-1.5 w-48 max-w-full';

  let storyContent: StoryContent | undefined = undefined;
  let storyContentRef: HTMLElement;
  let storyImages: Array<StoryImage> = [];
  let activeStoryImage: StoryImage | undefined;
  let isLoading = true;
  let isClosed = false;

  $: sourceLabel = getSourceLabel(storyContent?.source?.name);
  $: sourceUrl = storyContent?.source?.url ?? story?.url;
  $: handleContentChange(storyContentRef);

  onMount(async () => {
    try {
      if (!story?.id) {
        return;
      }

      storyContent = contentStore.getContent(story.id);
      if (storyContent) {
        setIsViewed(story);
        return;
      }

      storyContent = await fetchContentWithRetry(story);
      if (storyContent) {
        contentStore.setContent(story.id, storyContent);

        if (storyContent.id) {
          const originalContent = { ...storyContent };
          delete originalContent.source;
          contentStore.setContent(storyContent.id, originalContent);
        }

        setIsViewed(story);
      }
    } catch (error) {
      const { message } = error as Error;
      console.warn(`Error: ${message}`);
    } finally {
      isLoading = false;
    }
  });

  onDestroy(() => {
    isClosed = true;
  });

  async function fetchContentWithRetry(story: Story): Promise<StoryContent> {
    for (let retry = 0; retry < STORY_CONTENT_FETCH_MAX_RETRIES && !isClosed; retry++) {
      try {
        const fetchReadMoreContent = get(settings).fetchReadMoreContent && story.source === 'news';
        return await fetchContent(story.url, fetchReadMoreContent);
      } catch (_error) {
        if (retry < STORY_CONTENT_FETCH_MAX_RETRIES - 1) {
          await wait(1000 * 2 ** retry);
        }
      }
    }
    throw new Error(`Failed to load story content after ${STORY_CONTENT_FETCH_MAX_RETRIES} retries!`);
  }

  function setIsViewed(story: Story): void {
    if (story.isBookmarked && !story.isViewed) {
      bookmarks.setIsViewed(story);
    }
  }

  function handleCollapseFieldClick(): void {
    dispatch('collapse');
  }

  function handleCollapseFieldKeydown(event: KeyboardEvent): void {
    const code = event.code;
    if (code === 'Enter' || code === 'Space') {
      event.preventDefault();
      dispatch('collapse');
    }
  }

  function handleContentChange(ref?: HTMLElement): void {
    const images = [...(ref?.querySelectorAll('img') ?? [])];
    storyImages = images.map((image) => {
      const storyImage = {
        src: image.src,
        srcset: image.srcset,
        alt: image.alt,
      };

      image.tabIndex = 0;
      image.addEventListener('click', () => {
        activeStoryImage = storyImage;
      });
      image.addEventListener('keydown', (event) => {
        const { key } = event;
        if (key === 'Enter') {
          event.preventDefault();
          activeStoryImage = storyImage;
        }
      });
      return storyImage;
    });
  }

  function handleImageClose(): void {
    activeStoryImage = undefined;
  }
</script>

<div class={wrapperClass}>
  {#if isLoading}
    <StoryContentSkeleton />
  {:else if storyContent}
    <article class="story-content {contentClass}" data-testid="story-content">
      {#if sourceLabel}
        <div class={contentInfoClass}>Inhalt geladen von {sourceLabel}</div>
      {/if}
      <div bind:this={storyContentRef}>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html storyContent.content}
      </div>
      <div class={contentInfoClass}>Quelle: <Link href={sourceUrl}>orf.at</Link></div>
    </article>
  {:else}
    <p data-testid="story-content-error">
      Inhalt kann nicht angezeigt werden. Klicken Sie <Link class={errorLinkClass} href={story.url}>hier</Link> um zum Artikel
      zu gelangen.
    </p>
  {/if}
  <Button
    class={collapseContentClass}
    btnType="secondary"
    iconOnly
    title="Artikel schließen"
    on:click={handleCollapseFieldClick}
    on:keydown={handleCollapseFieldKeydown}
  >
    <ChevronUpIcon />
  </Button>
</div>

{#if activeStoryImage}
  <StoryImageViewer images={storyImages} bind:image={activeStoryImage} on:close={handleImageClose} />
{/if}
