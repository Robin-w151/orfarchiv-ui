<script lang="ts" module>
  const messageTemplate = (storyContent: StoryContent, extended = false): string => `
      Erstelle eine Zusammenfassung.
      Aufbau: Titel, ${extended ? 5 : 3} wichtige Punkte, Zusammenfassung in ungefähr ${extended ? 15 : 5} Sätzen.
      Text: """${storyContent.contentText}"""
    `;
</script>

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
  import Link from '$lib/components/shared/controls/Link.svelte';

  interface Props {
    storyContent: StoryContent;
    onClose?: () => void;
  }

  let { storyContent, onClose }: Props = $props();

  let aiService: AiService | undefined;
  let aiSummary = $state<StorySummary | undefined>(undefined);
  let aiSummaryLoading = $state(false);
  let aiSummaryError = $state<{ title: string; message: string } | undefined>(undefined);
  let aiSummaryCancel: (() => void) | undefined;

  onMount(async () => {
    const contentText = storyContent?.contentText;
    if (!contentText) {
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

    try {
      const messageTokens = await aiService.countTokens(contentText, model);
      const message = messageTemplate(storyContent, (messageTokens ?? 0) > 500);

      const { request, cancel } = aiService.sendMessage(message, StorySummary);
      aiSummaryCancel = cancel;
      aiSummary = await request;
      logger.debugGroup(
        'ai-summary',
        [
          ['ai-summary', $state.snapshot(aiSummary)],
          ['message-tokens', messageTokens],
        ],
        true,
      );
    } catch (error) {
      logger.warn(`Error: ${error}`);
      aiSummaryError = {
        title: 'Ein Fehler ist aufgetreten',
        message:
          'Beim Generieren der KI-Zusammenfassung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
      };
    } finally {
      aiSummaryLoading = false;
    }
  });

  onDestroy(async () => {
    if (aiSummaryCancel) {
      aiSummaryCancel();
      aiSummaryCancel = undefined;
    }

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
    <div class="flex flex-col items-center gap-4 pb-4">
      <article class="story-content" data-testid="ai-summary">
        <div class="byline">
          <p>
            Erstellt mit KI (Modell: <Link href={aiModelRefMap.get($settings.aiModel)!} target="_blank"
              >{$settings.aiModel}</Link
            >)
          </p>
        </div>
        <h1>{aiSummary.title}</h1>
        <ul>
          {#each aiSummary.points as point, index (index)}
            <li>
              <strong>{point.title}</strong>: <span>{point.text}</span>
            </li>
          {/each}
        </ul>
        <h2>Zusammenfassung</h2>
        <p>{aiSummary.summary}</p>
      </article>
    </div>
  {/if}
</Modal>
