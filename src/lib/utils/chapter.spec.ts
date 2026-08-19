import { describe, expect, test } from 'vitest';
import { getChapterTitle, getContentText } from './chapter';

describe('Chapter utils', () => {
  describe('getContentText', () => {
    test('joins the segments of all chapters', () => {
      const text = getContentText([
        { segments: ['Einleitung.', 'Noch ein Satz.'] },
        { title: 'Ausblick', segments: ['Ausblick. Erster Absatz.'] },
      ]);

      expect(text).toBe('Einleitung. Noch ein Satz. Ausblick. Erster Absatz.');
    });

    test('returns an empty text without chapters', () => {
      expect(getContentText([])).toBe('');
    });
  });

  describe('getChapterTitle', () => {
    test('returns the title of the chapter', () => {
      expect(getChapterTitle({ title: 'Ausblick', segments: [] }, 1)).toBe('Ausblick');
    });

    test('falls back to the story title', () => {
      expect(getChapterTitle({ segments: [] }, 0, 'Neuer Klimabericht')).toBe('Neuer Klimabericht');
    });

    test('keeps the title of the chapter over the story title', () => {
      expect(getChapterTitle({ title: 'Ausblick', segments: [] }, 1, 'Neuer Klimabericht')).toBe('Ausblick');
    });

    test('falls back to the chapter number without a story title', () => {
      expect(getChapterTitle({ segments: [] }, 0)).toBe('Kapitel 1');
      expect(getChapterTitle(undefined, 2)).toBe('Kapitel 3');
    });
  });
});
