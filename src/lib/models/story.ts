export interface Story {
  id: string;
  title: string;
  category: string;
  url: string;
  timestamp: string;
  source: string;
  isBookmarked?: number;
  isViewed?: number;
}

export interface StoryContent {
  content: string;
  id?: string;
  timestamp?: string;
  source?: StorySource;
}

export interface StorySource {
  name: string;
  url: string;
}

export interface StoryImage {
  src: string;
  srcset: string;
  alt: string;
}

export interface SearchStoryOptions {
  includeOesterreichSource?: boolean;
}
