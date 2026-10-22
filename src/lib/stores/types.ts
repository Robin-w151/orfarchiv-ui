import type { StoryContent } from '#lib/models/story.ts';

export interface SetContent {
  setContent: (id: string, content: StoryContent) => void;
}
