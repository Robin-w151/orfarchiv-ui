import type { Story } from '$lib/models/story';
import type { Subscribable } from '$lib/utils/subscriptions';
import { type Observable, Subject, filter, map, type NextObserver } from 'rxjs';

export interface EventsStore extends Subscribable<void> {
  onUpdate: Subscribable<void>['subscribe'];
  notify: (value: void) => void;
}

export interface SelectStoryStore extends Observable<string | undefined> {
  select: (select: SelectStory) => void;
}

export interface SelectStory {
  stories: Array<Story>;
  id: string;
  next: boolean;
}

export const refreshNews = createEventStore();

export const loadMoreNews = createEventStore();

export const startSearch = createEventStore();

export const selectStory = createStorySelectStore();

function createEventStore(): EventsStore {
  const subject = new Subject<void>();
  return {
    subscribe: (run: NextObserver<void> | ((value: void) => void)) => {
      const subscription = subject.subscribe(run);
      return () => subscription.unsubscribe();
    },
    onUpdate: (run: NextObserver<void> | ((value: void) => void)) => {
      const subscription = subject.subscribe(run);
      return () => subscription.unsubscribe();
    },
    notify: () => subject.next(),
  };
}

function createStorySelectStore(): SelectStoryStore {
  const subject = new Subject<SelectStory>();
  const store = subject.pipe(
    map(selectStory),
    filter((select) => !!select),
  );

  function selectStory({ stories, id, next }: SelectStory): string | undefined {
    const index = stories.findIndex((story) => story.id === id);
    if (next && index > -1 && index < stories.length - 1) {
      return stories[index + 1].id;
    }
    if (!next && index > 0) {
      return stories[index - 1].id;
    }
  }

  (store as SelectStoryStore).select = subject.next.bind(subject);
  return store as SelectStoryStore;
}
