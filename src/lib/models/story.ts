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

export interface StoryEntity {
  _id: unknown;
  id: string;
  title: string;
  category: string;
  url: string;
  timestamp: Date;
  source: string;
}

export interface StoryContent {
  content: string;
  contentText: string;
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
  alt: string;
}

export interface SearchStoryOptions {
  includeOesterreichSource?: boolean;
}
