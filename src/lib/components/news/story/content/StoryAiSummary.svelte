<script lang="ts">
  import Modal from '$lib/components/shared/content/Modal.svelte';
  import { StoryContent } from '$lib/models/story';
  import notifications from '$lib/stores/notifications';
  import settings from '$lib/stores/settings';
  import { logger } from '$lib/utils/logger';
  import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
  import SvelteMarkdown from '@humanspeak/svelte-markdown';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import StoryAiSummarySkeleton from './StoryAiSummarySkeleton.svelte';

  interface Props {
    storyContent: StoryContent;
    onClose?: () => void;
  }

  let { storyContent, onClose }: Props = $props();

  let aiSummary = $state<string>('');
  let aiSummaryStream: AsyncGenerator<GenerateContentResponse> | undefined;
  let aiSummaryLoading = $state(false);

  onMount(async () => {
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
  });

  onDestroy(async () => {
    if (aiSummaryStream) {
      await aiSummaryStream.return(undefined);
      aiSummaryStream = undefined;
    }

    aiSummary = '';
    aiSummaryLoading = false;
  });

  async function handleAiSummaryClose(): Promise<void> {
    onClose?.();
  }
</script>

<Modal modalClass="w-full h-full sm:h-3/5 lg:h-3/5" label="KI-Zusammenfassung" onClose={handleAiSummaryClose}>
  <article class="story-content" data-testid="ai-summary">
    <div class="byline">
      <p>
        Erstellt mit KI (Modell: <a href="https://duckduckgo.com/?q=ai+model+{$settings.aiModel}" target="_blank"
          >{$settings.aiModel}</a
        >)
      </p>
    </div>
    <SvelteMarkdown source={aiSummary}></SvelteMarkdown>
  </article>
  {#if aiSummaryLoading}
    <StoryAiSummarySkeleton />
  {/if}
</Modal>
