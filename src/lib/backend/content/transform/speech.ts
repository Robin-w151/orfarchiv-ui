import { CHAPTER_MAX_SEGMENT_BYTES } from '$lib/configs/shared';
import type { StoryContentChapter } from '$lib/models/story';
import { Context, Effect, Layer } from 'effect';

interface ChapterDraft {
  title?: string;
  parts: Array<string>;
}

const HEADER_SELECTOR = 'h1, h2, h3, h4, h5, h6';
const SENTENCE_SEPARATOR = /(?<=[.!?…])\s+/;
const CLAUSE_SEPARATOR = /(?<=[,;:])\s+/;
const WORD_SEPARATOR = /\s+/;
const SENTENCE_MARK = /[.!?…]$/;

export class SpeechService extends Context.Service<SpeechService>()('content/transform/SpeechService', {
  make: Effect.succeed({ extractChapters }),
}) {
  static readonly layerWithoutDependencies = Layer.effect(this, this.make);
  static readonly layer = this.layerWithoutDependencies;
}

function extractChapters(optimizedDocument: Document, originalDocument: Document) {
  return Effect.sync(() => {
    const unwantetPatterns = [/^\d+\s*\.\s+[a-zäöü]+\s+\d+,\s+\d+\.\d+\s+uhr(\s*\(update.*\))?$/i, /^online\s+seit/i];
    const keywordText = originalDocument.querySelector('div.keyword')?.textContent?.trim();

    const document = optimizedDocument.cloneNode(true) as Document;
    for (const element of document.querySelectorAll('p')) {
      const text = element.textContent?.trim() ?? '';
      const isKeyword = keywordText ? text === keywordText : false;
      if (isKeyword || unwantetPatterns.some((pattern) => pattern.test(text))) {
        element.remove();
      }
    }

    for (const element of document.querySelectorAll('.slideshow')) {
      element.parentElement?.remove();
    }

    for (const element of document.querySelectorAll('figcaption')) {
      element.remove();
    }

    for (const element of document.querySelectorAll('.story-footer')) {
      element.remove();
    }

    // The title is the header text as written, the spoken text always ends with a sentence mark so that the speech
    // synthesis pauses instead of running the header into the following sentence.
    const headerTitles = new Map<Element, string>();
    for (const header of document.querySelectorAll(HEADER_SELECTOR)) {
      const text = header.textContent?.trim() ?? '';
      if (!text) {
        continue;
      }

      headerTitles.set(header, text);
      if (!SENTENCE_MARK.test(text)) {
        header.textContent = `${text}.`;
      }
    }

    return splitIntoChapters(document.body, headerTitles).map(({ title, text }) => ({
      title,
      segments: splitIntoSegments(text, CHAPTER_MAX_SEGMENT_BYTES),
    })) satisfies Array<StoryContentChapter>;
  });
}

function splitIntoChapters(
  body: HTMLElement,
  headerTitles: Map<Element, string>,
): Array<{ title?: string; text: string }> {
  const chapters: Array<{ title?: string; text: string }> = [];
  let current: ChapterDraft = { parts: [] };

  function flush(): void {
    const text = current.parts.join(' ').replaceAll(/\s+/g, ' ').trim();
    if (text) {
      chapters.push({ title: current.title, text });
    }
  }

  function walk(node: Node): void {
    for (const child of node.childNodes) {
      if (child.nodeType === child.TEXT_NODE) {
        current.parts.push(child.textContent ?? '');
        continue;
      }

      if (child.nodeType !== child.ELEMENT_NODE) {
        continue;
      }

      const element = child as Element;
      const title = headerTitles.get(element);
      if (element.matches(HEADER_SELECTOR) && title) {
        flush();
        current = { title, parts: [element.textContent ?? ''] };
        continue;
      }

      walk(element);
    }
  }

  walk(body);
  flush();

  return chapters;
}

function splitIntoSegments(text: string, maxBytes: number): Array<string> {
  const segments: Array<string> = [];
  let segment = '';

  for (const sentence of splitOversizedParts(text.split(SENTENCE_SEPARATOR), maxBytes)) {
    const candidate = segment ? `${segment} ${sentence}` : sentence;
    if (segment && byteLength(candidate) > maxBytes) {
      segments.push(segment);
      segment = sentence;
    } else {
      segment = candidate;
    }
  }

  if (segment) {
    segments.push(segment);
  }

  return segments;
}

function splitOversizedParts(parts: Array<string>, maxBytes: number): Array<string> {
  return parts
    .map((part) => part.trim())
    .filter((part) => !!part)
    .flatMap((part) => (byteLength(part) <= maxBytes ? [part] : splitByClauses(part, maxBytes)));
}

function splitByClauses(text: string, maxBytes: number): Array<string> {
  return text
    .split(CLAUSE_SEPARATOR)
    .map((clause) => clause.trim())
    .filter((clause) => !!clause)
    .flatMap((clause) => (byteLength(clause) <= maxBytes ? [clause] : splitByWords(clause, maxBytes)));
}

function splitByWords(text: string, maxBytes: number): Array<string> {
  const parts: Array<string> = [];
  let part = '';

  for (const word of text.split(WORD_SEPARATOR).filter((word) => !!word)) {
    const candidate = part ? `${part} ${word}` : word;
    if (part && byteLength(candidate) > maxBytes) {
      parts.push(part);
      part = '';
    }

    if (byteLength(word) > maxBytes) {
      parts.push(...splitByCharacters(word, maxBytes));
    } else {
      part = part ? `${part} ${word}` : word;
    }
  }

  if (part) {
    parts.push(part);
  }

  return parts;
}

function splitByCharacters(text: string, maxBytes: number): Array<string> {
  const parts: Array<string> = [];
  let part = '';

  // Iterating code points instead of slicing by index never cuts a multi byte character in half
  for (const character of text) {
    if (byteLength(part + character) > maxBytes) {
      parts.push(part);
      part = '';
    }

    part += character;
  }

  if (part) {
    parts.push(part);
  }

  return parts;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
