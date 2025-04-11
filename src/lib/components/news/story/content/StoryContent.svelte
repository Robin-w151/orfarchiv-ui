<script lang="ts" module>
  interface ImageMeta {
    image: HTMLImageElement;
    source?: HTMLSourceElement;
  }
</script>

<script lang="ts">
  import { NewsApi } from '$lib/api/news';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import Link from '$lib/components/shared/controls/Link.svelte';
  import { STORY_CONTENT_FETCH_MAX_RETRIES } from '$lib/configs/client';
  import { getSourceLabel } from '$lib/models/settings';
  import type { Story, StoryContent, StoryImage } from '$lib/models/story';
  import bookmarks from '$lib/stores/bookmarks';
  import contentStore from '$lib/stores/content';
  import { audioStore } from '$lib/stores/runes/audio.svelte';
  import settings from '$lib/stores/settings';
  import { wait } from '$lib/utils/wait';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import StoryContentSkeleton from './StoryContentSkeleton.svelte';
  import StoryImageViewer from './StoryImageViewer.svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ChevronUp, PauseCircle, PlayCircle } from '@steeze-ui/heroicons';
  import { logger } from '$lib/utils/logger';

  interface Props {
    story: Story;
    onCollapse?: () => void;
  }

  let { story, onCollapse }: Props = $props();

  const newsApi = new NewsApi();

  const wrapperClass = 'flex flex-col items-center gap-3';
  const contentClass = 'cursor-auto w-full';
  const contentInfoClass = 'text-sm text-gray-500 dark:text-gray-400';
  const errorLinkClass = 'text-blue-700';
  const collapseContentClass = 'py-1.5 w-48 max-w-full';

  let storyContent: StoryContent | undefined = $state();
  let storyContentRef: HTMLElement | undefined = $state();
  let storyImages: Array<StoryImage> = $state([]);
  let activeStoryImage: StoryImage | undefined = $state();
  let isLoading = $state(true);
  let isClosed = false;

  let sourceLabel = $derived(getSourceLabel(storyContent?.source?.name));
  let sourceUrl = $derived(storyContent?.source?.url ?? story?.url);
  let isPlaying = $derived(audioStore.story?.id === story.id && audioStore.isPlaying);

  $effect(() => {
    handleContentChange(storyContentRef);
  });

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
        logger.infoGroup('text-content', [[storyContent.contentText]], true);

        if (storyContent.id) {
          const originalContent = { ...storyContent };
          delete originalContent.source;
          contentStore.setContent(storyContent.id, originalContent);
        }

        setIsViewed(story);
      }
    } catch (error) {
      const { message } = error as Error;
      logger.warn(`Error: ${message}`);
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
        return await newsApi.fetchContent(story.url, fetchReadMoreContent);
      } catch (error) {
        const { message } = error as Error;
        logger.warn(`Error: ${message}`);

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
    onCollapse?.();
  }

  function handleCollapseFieldKeydown(event: KeyboardEvent): void {
    const code = event.code;
    if (code === 'Enter' || code === 'Space') {
      event.preventDefault();
      onCollapse?.();
    }
  }

  function handleContentChange(ref?: HTMLElement): void {
    const images = findAllImages(ref);

    storyImages = Array.from(images.entries()).map(([image, meta]) => {
      const storyImage = {
        src: meta?.source?.srcset ?? image.src,
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

  function handlePlayArticle(): void {
    if (isPlaying) {
      audioStore.pause();
      return;
    }

    if (!storyContent?.contentText) {
      return;
    }

    audioStore.read(story, storyContent.contentText);
  }

  function findAllImages(ref?: HTMLElement): Map<HTMLImageElement, ImageMeta> {
    const images = new Map<HTMLImageElement, ImageMeta>();
    for (const picture of querySelectorAll(ref, 'picture')) {
      const image = picture.querySelector('img');
      if (image) {
        images.set(image, { image, source: findLargestSource(querySelectorAll(picture, 'source')) });
      }
    }

    for (const image of querySelectorAll<HTMLImageElement>(ref, 'img')) {
      if (!images.has(image)) {
        images.set(image, { image });
      }
    }

    return images;
  }

  function findLargestSource(sources: Array<HTMLSourceElement>): HTMLSourceElement {
    return sources.toSorted((a, b) => b.width - a.width)[0];
  }

  function querySelectorAll<T extends Element>(element: Element | null | undefined, selector: string): Array<T> {
    if (!element) {
      return [];
    }

    return Array.from<T>(element.querySelectorAll(selector));
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
        {#if audioStore.isAvailable}
          <div class="inline-block float-right ml-2 mb-2">
            <Button class="w-fit" btnType="secondary" onclick={handlePlayArticle}>
              {#if isPlaying}
                <Icon src={PauseCircle} theme="outlined" class="size-6" />
              {:else}
                <Icon src={PlayCircle} theme="outlined" class="size-6" />
              {/if}
              <span>Vorlesen</span>
            </Button>
          </div>
        {/if}
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
    onclick={handleCollapseFieldClick}
    onkeydown={handleCollapseFieldKeydown}
  >
    <Icon src={ChevronUp} theme="outlined" class="size-6" />
  </Button>
</div>

{#if activeStoryImage}
  <StoryImageViewer images={storyImages} bind:image={activeStoryImage} onClose={handleImageClose} />
{/if}
