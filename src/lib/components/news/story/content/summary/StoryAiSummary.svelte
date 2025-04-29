<script lang="ts" module>
  const messageTemplate = (storyContent: StoryContent, extended = false): string => `
      Du bist ein hilfreicher Assistent, der präzise und informative Zusammenfassungen von Nachrichtenartikeln erstellt.
      Erstelle eine neutrale und sachliche Zusammenfassung des folgenden Textes. Die Zusammenfassung soll sich strikt an die Fakten im Text halten und keine externen Informationen oder Meinungen hinzufügen.

      **Anweisungen:**
      1.  **Titel:** Gib der Zusammenfassung einen kurzen, prägnanten Titel, der den Hauptinhalt des Artikels widerspiegelt.
      2.  **Wichtige Punkte:** Liste die ${extended ? 5 : 3} wichtigsten Kernaussagen des Textes als Stichpunkte auf. Jeder Punkt sollte eine klare Aussage sein.
      3.  **Zusammenfassung:** Schreibe eine Fliesstext-Zusammenfassung.
          *   Länge: Ungefähr ${extended ? '15' : '5'} Sätze. Die Gesamtlänge der Zusammenfassung (inklusive Titel und Stichpunkte) darf 25% der Länge des Originaltextes nicht überschreiten.
          *   Inhalt: Fasse die Hauptinformationen des Artikels zusammen.
          *   Stil: Neutral, objektiv und informativ. Verwende die gleiche Sprache wie der Originaltext.

      **Originaltext:**
      """${storyContent.contentText}"""
    `;
</script>

<script lang="ts">
  import AlertBox from '$lib/components/shared/content/AlertBox.svelte';
  import Modal from '$lib/components/shared/content/Modal.svelte';
  import { StoryContent, StorySummary } from '$lib/models/story';
  import { AiService } from '$lib/services/ai/ai';
  import settings from '$lib/stores/settings';
  import { aiModelConfigMap } from '$lib/configs/client';
  import { logger } from '$lib/utils/logger';
  import { ArrowPath, ExclamationCircle } from '@steeze-ui/heroicons';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import StoryAiSummarySkeleton from './StoryAiSummarySkeleton.svelte';
  import Link from '$lib/components/shared/controls/Link.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { Icon } from '@steeze-ui/svelte-icon';

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

    aiService = new AiService(apiKey, model);
    await aiService.newChat();

    await generateAiSummary();
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

  async function handleAiSummaryRegenerate(): Promise<void> {
    await generateAiSummary();
  }

  async function generateAiSummary(): Promise<void> {
    if (!storyContent?.contentText || !aiService) {
      return;
    }

    aiSummaryCancel?.();
    aiSummaryLoading = true;

    try {
      const messageTokens = await aiService.countTokens(storyContent.contentText);
      const message = messageTemplate(storyContent, (messageTokens ?? 0) > 800);

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
      aiSummaryCancel = undefined;
      aiSummaryLoading = false;
    }
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
          <p class="flex items-center gap-2">
            <Button btnType="secondary" title="Erneut generieren" iconOnly round onclick={handleAiSummaryRegenerate}>
              <Icon src={ArrowPath} class="h-4 w-4" />
            </Button>
            <span
              >Erstellt mit KI (Modell: <Link href={aiModelConfigMap.get($settings.aiModel)!.ref} target="_blank"
                >{$settings.aiModel}</Link
              >)</span
            >
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
