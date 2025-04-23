<script lang="ts">
  import AlertBox from '$lib/components/shared/content/AlertBox.svelte';
  import Modal from '$lib/components/shared/content/Modal.svelte';
  import { StoryContent, StorySummary } from '$lib/models/story';
  import { AiService } from '$lib/services/ai/ai';
  import settings from '$lib/stores/settings';
  import { aiModelRefMap } from '$lib/utils/ai';
  import { logger } from '$lib/utils/logger';
  import { ExclamationCircle } from '@steeze-ui/heroicons';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import StoryAiSummarySkeleton from './StoryAiSummarySkeleton.svelte';

  interface Props {
    storyContent: StoryContent;
    onClose?: () => void;
  }

  let { storyContent, onClose }: Props = $props();

  let aiService: AiService | undefined;
  let aiSummary = $state<StorySummary | undefined>(undefined);
  let aiSummaryLoading = $state(false);
  let aiSummaryError = $state<{ title: string; message: string } | undefined>(undefined);

  onMount(async () => {
    if (!storyContent?.contentText) {
      onClose?.();
      return;
    }

    const model = get(settings).aiModel;
    const apiKey = get(settings).geminiApiKey;
    if (!apiKey) {
      logger.warn('No Gemini API Key found');
      aiSummaryError = {
        title: 'Kein API-Key hinterlegt',
        message: 'Es ist kein API-Key für die AI Zusammenfassung hinterlegt.',
      };
      return;
    }

    aiSummaryLoading = true;

    aiService = new AiService(apiKey);
    await aiService.newChat(model);

    const message = `
      Erstelle eine Zusammenfassung.
      Aufbau: Titel, 3 wichtige Punkte, Zusammenfassung in ungefähr 5 Sätzen.
      Text: """${storyContent.contentText}"""
    `;

    try {
      aiSummary = await aiService.sendMessage(message, StorySummary);
    } catch (error) {
      logger.warn(`Error: ${error}`);
      aiSummaryError = {
        title: 'Ein Fehler ist aufgetreten',
        message:
          'Beim Generieren der KI-Zusammenfassung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
      };
    }

    logger.debugGroup('ai-summary', [['ai-summary', aiSummary]], true);

    aiSummaryLoading = false;
  });

  onDestroy(async () => {
    aiSummary = undefined;
    aiSummaryLoading = false;
  });

  async function handleAiSummaryClose(): Promise<void> {
    onClose?.();
  }
</script>

<Modal
  modalClass="w-full h-full sm:h-[max(60%,36rem)] lg:h-[max(60%,48rem)]"
  label="KI-Zusammenfassung"
  onClose={handleAiSummaryClose}
>
  {#if aiSummaryError}
    <AlertBox
      title={aiSummaryError.title}
      message={aiSummaryError.message}
      icon={ExclamationCircle}
      boxPadding="p-4 sm:p-8"
    />
  {:else if aiSummaryLoading}
    <StoryAiSummarySkeleton />
  {:else if aiSummary}
    <article class="story-content" data-testid="ai-summary">
      <div class="byline">
        <p>
          Erstellt mit KI (Modell: <a href={aiModelRefMap.get($settings.aiModel)} target="_blank">{$settings.aiModel}</a
          >)
        </p>
      </div>
      <h1>{aiSummary.title}</h1>
      <ul>
        {#each aiSummary.points as point (point)}
          <li>{point}</li>
        {/each}
      </ul>
      <h2>Zusammenfassung</h2>
      <p>{aiSummary.summary}</p>
    </article>
  {/if}
</Modal>
