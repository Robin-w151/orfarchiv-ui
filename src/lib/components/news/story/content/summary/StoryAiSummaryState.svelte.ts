import { browser } from '$app/environment';
import { STORY_SUMMARY_EXTENDED_WORD_LIMIT } from '$lib/configs/client';
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
  Du bist ein erfahrener Nachrichtenredakteur und Analyst, spezialisiert auf die Erstellung präziser, unvoreingenommener und faktenbasierter Zusammenfassungen.
  Dein Ziel ist es, den folgenden Nachrichtenartikel objektiv und wertungsfrei zusammenzufassen.
  Konzentriere dich ausschließlich auf die im Text präsentierten Informationen.

  **Anweisungen für die Ausgabe:**
  1.  **Titel:** Erstelle einen kurzen, prägnanten Titel (maximal 10 Wörter), der den Kern des Artikels erfasst.
  2.  **Kernaussagen in Stichpunkten:** Fasse die wichtigsten Informationen in ${extended ? '5' : '3'} separaten Stichpunkten zusammen.
      *   **Aussagentitel:** Jeder Stichpunkt beginnt mit einem Titel von maximal 5 Wörtern.
      *   **Aussage:** Fasse die jeweilige Kernaussage in 2 bis 5 vollständigen, aber kurzen Sätzen zusammen. Formuliere klar und verständlich.
  3.  **Stil und Sprache:**
      *   **Sprache:** Die Ausgabe muss immer auf Deutsch sein.
      *   **Tonalität:** Der Stil muss neutral, sachlich und informativ sein. Übernimm die formelle Tonalität des Originaltextes, aber vermeide Umgangssprache oder subjektive Formulierungen.

  **Was strikt zu vermeiden ist:**
  *   Externe Informationen, die nicht im Originaltext enthalten sind.
  *   Persönliche Meinungen, Interpretationen oder Wertungen.
  *   Spekulationen über Motive oder zukünftige Entwicklungen, die nicht explizit im Text genannt werden.
  *   Wörtliche Zitate, es sei denn, sie sind für das Verständnis unerlässlich und werden klar als Zitat gekennzeichnet.

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
      const message = messageTemplate(storyContent, this.isExtended(messageWords));

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

  private isExtended = (messageWords: number | undefined): boolean => {
    return (messageWords ?? 0) > STORY_SUMMARY_EXTENDED_WORD_LIMIT;
  };
}
