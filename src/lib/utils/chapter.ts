import type { StoryContentChapter } from '$lib/models/story';

export function getContentText(chapters: ReadonlyArray<StoryContentChapter>): string {
  return chapters.flatMap((chapter) => chapter.segments).join(' ');
}

export function getChapterTitle(chapter: StoryContentChapter | undefined, index: number, storyTitle?: string): string {
  return chapter?.title ?? storyTitle ?? `Kapitel ${index + 1}`;
}
