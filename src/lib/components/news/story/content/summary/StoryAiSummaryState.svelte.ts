import { browser } from '$app/environment';
import { StorySummary, type StoryContent } from '$lib/models/story';
import { AiService } from '$lib/services/ai/ai';
import settings from '$lib/stores/settings';
import { logger } from '$lib/utils/logger';
import { Effect, Fiber } from 'effect';
import { get } from 'svelte/store';

const messageTemplate = (storyContent: StoryContent, extended = false): string => `
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
  """${storyContent.contentText}"""
`;

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

  initialize = async (): Promise<void> => {
    const aiService = this.aiService;
    if (!aiService) {
      return;
    }

    await Effect.runPromise(aiService.newChat());
  };

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

    const self = this;
    const program = Effect.gen(function* () {
      yield* Effect.sync(() => {
        self.aiSummaryLoading = true;
      });

      const messageTokens = yield* aiService.countTokens(storyContent.contentText);
      const message = messageTemplate(storyContent, (messageTokens ?? 0) > 800);

      const summary = yield* aiService.sendMessage(message, StorySummary);

      yield* Effect.sync(() => {
        self.aiSummary = summary;
        logger.debugGroup(
          'ai-summary',
          [
            ['ai-summary', $state.snapshot(self.aiSummary)],
            ['message-tokens', messageTokens],
          ],
          true,
        );
      });
    }).pipe(
      Effect.catchTag('AiServiceError', (error) =>
        Effect.sync(() => {
          logger.warn(`Error: ${error}`);
          self.aiSummaryError = {
            title: 'Ein Fehler ist aufgetreten',
            message:
              'Beim Generieren der KI-Zusammenfassung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
          };
        }),
      ),
      Effect.ensuring(
        Effect.sync(() => {
          self.aiSummaryCancel = undefined;
          self.aiSummaryLoading = false;
        }),
      ),
    );

    const fiber = Effect.runFork(program);

    this.aiSummaryCancel = () => Effect.runSync(Fiber.interruptFork(fiber));
  };
}
