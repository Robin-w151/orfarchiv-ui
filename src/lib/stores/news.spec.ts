import type { News } from '$lib/models/news';
import type { Story } from '$lib/models/story';
import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import news from './news';

function story(id: string, timestamp: string): Story {
  return { id, title: `Title ${id}`, url: 'https://orf.at/stories/1', timestamp, source: 'news' };
}

const stories = [
  story('a', '2026-08-29T10:00:00.000Z'),
  story('b', '2026-08-28T10:00:00.000Z'),
  story('c', '2026-08-27T10:00:00.000Z'),
];

describe('News store', () => {
  describe('buckets', () => {
    it('buckets by date when the response carries no ordering', () => {
      news.setNews({ stories } as News);
      expect(get(news).storyBuckets).toHaveLength(3);
    });

    it('produces exactly one bucket in relevance mode', () => {
      news.setNews({ stories, ordering: 'relevance' } as News);
      const buckets = get(news).storyBuckets;
      expect(buckets).toHaveLength(1);
      expect(buckets?.[0].name).toBe('3 Ergebnisse');
      expect(buckets?.[0].stories.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    });

    it('preserves server order rather than sorting by date', () => {
      const shuffled = [stories[2], stories[0], stories[1]];
      news.setNews({ stories: shuffled, ordering: 'relevance' } as News);
      expect(get(news).storyBuckets?.[0].stories.map((s) => s.id)).toEqual(['c', 'a', 'b']);
    });

    it('returns to date buckets when switching back to a keyword search', () => {
      news.setNews({ stories, ordering: 'relevance' } as News);
      expect(get(news).storyBuckets).toHaveLength(1);
      news.setNews({ stories } as News);
      expect(get(news).storyBuckets).toHaveLength(3);
    });

    it('uses the singular for a single result', () => {
      news.setNews({ stories: [stories[0]], ordering: 'relevance' } as News);
      expect(get(news).storyBuckets?.[0].name).toBe('1 Ergebnis');
    });
  });
});
