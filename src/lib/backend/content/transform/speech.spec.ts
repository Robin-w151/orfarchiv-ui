import { CHAPTER_MAX_SEGMENT_BYTES } from '$lib/configs/shared';
import type { StoryContentChapter } from '$lib/models/story';
import { Effect } from 'effect';
import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { SpeechService } from './speech';

const mockUrl = 'https://www.orf.at/stories/1234567890';

describe('Chapter extraction', () => {
  describe('chapters', () => {
    test('returns a single untitled chapter without headers', () => {
      const chapters = extractChapters('<p>Hello World.</p><p>Goodbye World.</p>');

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBeUndefined();
      expect(text(chapters[0])).toBe('Hello World. Goodbye World.');
    });

    test('returns one chapter per header', () => {
      const chapters = extractChapters(`
        <h2>Reaktionen aus der Politik</h2>
        <p>Erster Absatz.</p>
        <h2>Ausblick</h2>
        <p>Zweiter Absatz.</p>
      `);

      expect(chapters.map((chapter) => chapter.title)).toEqual(['Reaktionen aus der Politik', 'Ausblick']);
      expect(text(chapters[0])).toBe('Reaktionen aus der Politik. Erster Absatz.');
      expect(text(chapters[1])).toBe('Ausblick. Zweiter Absatz.');
    });

    test('keeps the punctuation of a header ending with a question mark', () => {
      const chapters = extractChapters('<h2>Wie geht es weiter?</h2><p>Erster Absatz.</p>');

      expect(chapters[0].title).toBe('Wie geht es weiter?');
      expect(text(chapters[0])).toBe('Wie geht es weiter? Erster Absatz.');
    });

    test('returns the text before the first header as leading untitled chapter', () => {
      const chapters = extractChapters('<p>Einleitung.</p><h2>Ausblick</h2><p>Zweiter Absatz.</p>');

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBeUndefined();
      expect(text(chapters[0])).toBe('Einleitung.');
      expect(chapters[1].title).toBe('Ausblick');
    });

    test('returns no untitled chapter when the content starts with a header', () => {
      const chapters = extractChapters('<h2>Ausblick</h2><p>Erster Absatz.</p>');

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Ausblick');
    });

    test('splits at a header nested inside another element', () => {
      const chapters = extractChapters('<section><p>Einleitung.</p><h2>Ausblick</h2><p>Erster Absatz.</p></section>');

      expect(chapters.map((chapter) => chapter.title)).toEqual([undefined, 'Ausblick']);
    });

    test('ignores an empty header', () => {
      const chapters = extractChapters('<p>Einleitung.</p><h2>  </h2><p>Erster Absatz.</p>');

      expect(chapters).toHaveLength(1);
      expect(text(chapters[0])).toBe('Einleitung. Erster Absatz.');
    });

    test('keeps a header only chapter and drops an empty chapter', () => {
      const chapters = extractChapters('<h2>Ausblick</h2><h2>Reaktionen</h2><p>Erster Absatz.</p><p>  </p>');

      expect(chapters.map((chapter) => chapter.title)).toEqual(['Ausblick', 'Reaktionen']);
      expect(text(chapters[0])).toBe('Ausblick.');
    });

    test('returns the text of nested elements only once', () => {
      const chapters = extractChapters('<p>Hello <strong>World</strong>.</p>');

      expect(text(chapters[0])).toBe('Hello World.');
    });
  });

  describe('segments', () => {
    test('splits a chapter into segments below the byte limit', () => {
      const sentence = `${'Ein sehr langer Satz über die Lage in Österreich'.repeat(10)}.`;
      const chapters = extractChapters(`<p>${sentence.repeat(20)}</p>`);

      expect(chapters[0].segments.length).toBeGreaterThan(1);
      for (const segment of chapters[0].segments) {
        expect(byteLength(segment)).toBeLessThanOrEqual(CHAPTER_MAX_SEGMENT_BYTES);
      }
    });

    test('measures the limit in bytes and not in characters', () => {
      const sentence = `${'ÄÖÜ'.repeat(300)}.`;
      const chapters = extractChapters(`<p>${sentence.repeat(4)}</p>`);

      expect(chapters[0].segments.length).toBeGreaterThan(1);
      for (const segment of chapters[0].segments) {
        expect(segment.length).toBeLessThan(CHAPTER_MAX_SEGMENT_BYTES);
        expect(byteLength(segment)).toBeLessThanOrEqual(CHAPTER_MAX_SEGMENT_BYTES);
      }
    });

    test('splits a single sentence exceeding the limit without losing text', () => {
      const sentence = `${'Wort '.repeat(2000).trim()}.`;
      const chapters = extractChapters(`<p>${sentence}</p>`);

      expect(chapters[0].segments.length).toBeGreaterThan(1);
      for (const segment of chapters[0].segments) {
        expect(byteLength(segment)).toBeLessThanOrEqual(CHAPTER_MAX_SEGMENT_BYTES);
      }
      expect(text(chapters[0])).toBe(sentence);
    });

    test('splits a single word exceeding the limit', () => {
      const word = 'Ä'.repeat(4000);
      const chapters = extractChapters(`<p>${word}</p>`);

      for (const segment of chapters[0].segments) {
        expect(byteLength(segment)).toBeLessThanOrEqual(CHAPTER_MAX_SEGMENT_BYTES);
      }
      expect(chapters[0].segments.join('')).toBe(word);
    });
  });

  describe('cleanup', () => {
    test('removes the keyword paragraph', () => {
      const chapters = extractChapters('<p>Chronik</p><p>Hello World.</p>', '<div class="keyword">Chronik</div>');

      expect(text(chapters[0])).toBe('Hello World.');
    });

    test('removes the timestamp and online seit paragraphs', () => {
      const chapters = extractChapters('<p>6. April 2023, 22.00 Uhr</p><p>Online seit gestern</p><p>Hello World.</p>');

      expect(text(chapters[0])).toBe('Hello World.');
    });

    test('removes slideshows, figcaptions and the story footer', () => {
      const chapters = extractChapters(`
        <figure><div class="slideshow">Diashow</div></figure>
        <figure><img src="https://orf.at/image.jpg" /><figcaption>Bildtext</figcaption></figure>
        <p>Hello World.</p>
        <div class="story-footer"><p>Mehr dazu.</p></div>
      `);

      expect(text(chapters[0])).toBe('Hello World.');
    });
  });
});

function extractChapters(html: string, originalHtml = ''): Array<StoryContentChapter> {
  const optimizedDocument = createDocument(html);
  const originalDocument = createDocument(originalHtml);

  return Effect.runSync(
    Effect.gen(function* () {
      const speechService = yield* SpeechService;
      return yield* speechService.extractChapters(optimizedDocument, originalDocument);
    }).pipe(Effect.provide(SpeechService.layer)),
  );
}

function createDocument(html: string): Document {
  return new JSDOM(html, { url: mockUrl }).window.document;
}

function text(chapter: StoryContentChapter): string {
  return chapter.segments.join(' ');
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
