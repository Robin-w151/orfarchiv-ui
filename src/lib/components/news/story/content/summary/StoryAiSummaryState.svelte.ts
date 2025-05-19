import { browser } from '$app/environment';
import type { AiServiceError } from '$lib/errors/errors';
import { StorySummary, type StoryContent } from '$lib/models/story';
import { AiService } from '$lib/services/ai/ai';
import settings from '$lib/stores/settings';
import { runEffect } from '$lib/utils/effectHelper';
import { logger } from '$lib/utils/logger';
import { Effect } from 'effect';
import { get } from 'svelte/store';

function messageTemplate(storyContent: StoryContent, extended = false): string {
  return `
  Du bist ein hilfreicher Assistent, der präzise und informative Zusammenfassungen von Nachrichtenartikeln erstellt.
  Erstelle eine neutrale und sachliche Zusammenfassung des folgenden Textes. Die Zusammenfassung soll sich strikt an die Fakten im Text halten und keine externen Informationen oder Meinungen hinzufügen.
  Die Sprache soll immer Deutsch sein.

  **Anweisungen:**
  1.  **Titel:** Gib der Zusammenfassung einen kurzen, prägnanten Titel, der den Hauptinhalt des Artikels widerspiegelt.
  2.  **Wichtige Punkte:** Liste die ${extended ? 5 : 3} wichtigsten Kernaussagen des Textes als Stichpunkte auf. Jeder Punkt sollte eine klare Aussage sein.
  3.  **Zusammenfassung:** Schreibe eine Fliesstext-Zusammenfassung.
      *   Länge: Ungefähr ${extended ? '15' : '5'} Sätze. Die Gesamtlänge der Zusammenfassung (inklusive Titel und Stichpunkte) darf 25% der Länge des Originaltextes nicht überschreiten.
      *   Inhalt: Fasse die Hauptinformationen des Artikels zusammen.
      *   Stil: Neutral, objektiv und informativ. Verwende die gleiche Sprache wie der Originaltext.

  **Originaltext:**
  """
  ${storyContent.contentText}
  """
`;
}

function errorMessage(error: AiServiceError): string {
  switch (error.type) {
    case 'TIMEOUT':
      return 'Das Generieren der KI-Zusammenfassung hat zu lange gedauert. Eventuell gibt es Probleme mit der Netzwerkverbindung oder das KI-Modell ist überlastet. Bitte versuchen Sie es später erneut.';
    case 'RATE_LIMIT':
      return 'Beim Generieren der KI-Zusammenfassung ist ein Fehler aufgetreten. Möglicherweise ist nicht ausreichend Guthaben vorhanden oder es wurden in letzter Zeit zu viele Anfragen an die KI gestellt. Wechseln Sie das KI-Modell in den Einstellungen oder versuchen Sie es später erneut.';
    default:
      return 'Beim Generieren der KI-Zusammenfassung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.';
  }
}

export class StoryAiSummaryState {
  aiSummary = $state<StorySummary | undefined>(undefined);
  aiSummaryLoading = $state(false);
  aiSummaryError = $state<{ title: string; message: string } | undefined>(undefined);
  aiSummaryCancel: (() => void) | undefined;

  private readonly aiService: AiService | undefined;

  constructor(readonly storyContent: StoryContent) {
    if (!browser) {
      return;
    }

    const model = get(settings).aiModel;
    const apiKey = get(settings).geminiApiKey;
    if (!apiKey) {
      logger.warn('No Gemini API Key found');
      this.aiSummaryError = {
        title: 'Kein API-Key hinterlegt',
        message: 'Es ist kein API-Key für die AI Zusammenfassung hinterlegt.',
      };
      return;
    }

    this.aiService = new AiService(apiKey, model);
  }

  destroy = (): void => {
    if (this.aiSummaryCancel) {
      this.aiSummaryCancel();
      this.aiSummaryCancel = undefined;
    }

    this.aiSummary = undefined;
    this.aiSummaryLoading = false;
    this.aiSummaryError = undefined;
  };

  generateAiSummary = async (): Promise<void> => {
    const storyContent = this.storyContent;
    const aiService = this.aiService;
    if (!storyContent?.contentText || !aiService) {
      return;
    }

    this.aiSummaryCancel?.();

    const effect = Effect.gen(this, function* () {
      yield* Effect.sync(() => {
        this.aiSummaryLoading = true;
        this.aiSummaryError = undefined;
      });

      const messageWords = yield* aiService.countWords(storyContent.contentText);
      const message = messageTemplate(storyContent, (messageWords ?? 0) > 400);

      const summary = yield* aiService.sendMessage(message, StorySummary);

      yield* Effect.sync(() => {
        this.aiSummary = summary;
      });
    }).pipe(
      Effect.catchTag('AiServiceError', (error) =>
        Effect.sync(() => {
          logger.errorGroup('story-summary-error', [
            ['error', error],
            ['type', error.type],
          ]);
          this.aiSummaryError = {
            title: 'Ein Fehler ist aufgetreten',
            message: errorMessage(error),
          };
        }),
      ),
      Effect.ensuring(
        Effect.sync(() => {
          this.aiSummaryCancel = undefined;
          this.aiSummaryLoading = false;
        }),
      ),
    );

    const { cancel } = runEffect(effect);
    this.aiSummaryCancel = cancel;
  };
}
