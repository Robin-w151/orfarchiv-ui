<script lang="ts" module>
  interface ImageMeta {
    image: HTMLImageElement;
    source?: HTMLSourceElement;
  }
</script>

<script lang="ts">
  import { NewsApi } from '$lib/api/news';
  import Modal from '$lib/components/shared/content/Modal.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import Link from '$lib/components/shared/controls/Link.svelte';
  import type { Request } from '$lib/models/request';
  import { getSourceLabel } from '$lib/models/settings';
  import type { Story, StoryContent, StoryImage } from '$lib/models/story';
  import bookmarks from '$lib/stores/bookmarks';
  import contentStore from '$lib/stores/content';
  import notifications from '$lib/stores/notifications';
  import { audioStore } from '$lib/stores/runes/audio.svelte';
  import settings from '$lib/stores/settings';
  import { logger } from '$lib/utils/logger';
  import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
  import SvelteMarkdown from '@humanspeak/svelte-markdown';
  import { ChevronUp, PauseCircle, PlayCircle, Sparkles } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import StoryAiSummarySkeleton from './StoryAiSummarySkeleton.svelte';
  import StoryContentSkeleton from './StoryContentSkeleton.svelte';
  import StoryImageViewer from './StoryImageViewer.svelte';

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
  let cancelActiveRequest: (() => void) | undefined = undefined;

  let aiSummary = $state<string>('');
  let aiSummaryStream: AsyncGenerator<GenerateContentResponse> | undefined;
  let aiSummaryLoading = $state(false);

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

      const { request, cancel } = fetchContent(story);
      cancelActiveRequest = cancel;
      storyContent = await request;
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
    cancelActiveRequest?.();
  });

  function fetchContent(story: Story): Request<StoryContent> {
    const fetchReadMoreContent = get(settings).fetchReadMoreContent && story.source === 'news';
    return newsApi.fetchContent(story.url, fetchReadMoreContent);
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

  async function handleGenerateAiSummary(): Promise<void> {
    if (!storyContent?.contentText) {
      return;
    }

    const model = get(settings).aiModel;
    const apiKey = get(settings).geminiApiKey;
    if (!apiKey) {
      logger.warn('No Gemini API Key found');
      notifications.notify('Kein API-Key hinterlegt', 'Es ist kein API-Key für die AI Zusammenfassung hinterlegt.', {
        forceAppNotification: true,
      });
      return;
    }

    aiSummaryLoading = true;

    const contents = `
      Erstelle eine Zusammenfassung.
      Aufbau: Titel, 3 wichtige Punkte, Zusammenfassung in ungefähr 5 Sätzen.
      Format: markdown only content.
      Text: """${storyContent.contentText}"""
    `;

    try {
      const ai = new GoogleGenAI({ apiKey });
      aiSummaryStream = await ai.models.generateContentStream({
        model,
        contents,
      });

      if (aiSummaryLoading) {
        for await (const chunk of aiSummaryStream) {
          aiSummary = (aiSummary ?? '') + chunk.text?.replaceAll(/(```|markdown)/g, '');
        }
      } else {
        await aiSummaryStream.return(undefined);
      }
    } catch (error) {
      logger.warn(`Error: ${error}`);
      notifications.notify(
        'Fehler beim Generieren der KI-Zusammenfassung',
        'Es ist ein Fehler beim Generieren der KI-Zusammenfassung aufgetreten.',
        {
          forceAppNotification: true,
        },
      );
    }

    logger.debugGroup('ai-summary', [['ai-summary', aiSummary]], true);

    aiSummaryStream = undefined;
    aiSummaryLoading = false;
  }

  async function handleAiSummaryClose(): Promise<void> {
    if (aiSummaryStream) {
      await aiSummaryStream.return(undefined);
      aiSummaryStream = undefined;
    }

    aiSummary = '';
    aiSummaryLoading = false;
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
        {#if $settings.aiSummaryEnabled || audioStore.isAvailable}
          <div class="inline-flex flex-col sm:flex-row items-end gap-1 sm:gap-2 float-right ml-2 mb-2">
            {#if $settings.aiSummaryEnabled}
              <Button class="w-fit" btnType="secondary" onclick={handleGenerateAiSummary}>
                <Icon src={Sparkles} theme="outlined" class="size-6" />
                <span>KI-Zusammenfassung</span>
              </Button>
            {/if}
            {#if $settings.audioEnabled && audioStore.isAvailable}
              <Button class="w-fit" btnType="secondary" onclick={handlePlayArticle}>
                {#if isPlaying}
                  <Icon src={PauseCircle} theme="outlined" class="size-6" />
                {:else}
                  <Icon src={PlayCircle} theme="outlined" class="size-6" />
                {/if}
                <span>Vorlesen</span>
              </Button>
            {/if}
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

{#if aiSummary || aiSummaryLoading}
  <Modal modalClass="w-full h-full sm:h-4/5 lg:h-3/5" label="KI-Zusammenfassung" onClose={handleAiSummaryClose}>
    <article class="story-content {contentClass}" data-testid="ai-summary">
      <div class="byline">
        <p>Generiert mit KI ({$settings.aiModel})</p>
      </div>
      <SvelteMarkdown source={aiSummary}></SvelteMarkdown>
    </article>
    {#if aiSummaryLoading}
      <StoryAiSummarySkeleton />
    {/if}
  </Modal>
{/if}
