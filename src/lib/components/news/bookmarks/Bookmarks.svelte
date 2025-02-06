<script lang="ts">
  import bookmarks from '$lib/stores/bookmarks';
  import Content from '$lib/components/shared/content/Content.svelte';
  import NewsList from '../NewsList.svelte';
  import { defaultAlertTextBox } from '$lib/utils/styles';
  import BookmarkActions from '../filter/BookmarkActions.svelte';
  import NewsListSkeleton from '$lib/components/news/NewsListSkeleton.svelte';
  import { get } from 'svelte/store';
  import { selectStory } from '$lib/stores/newsEvents';

  let bookmarksAvailable = $derived($bookmarks.filteredStories?.length > 0);
  let bookmarksBucket = $derived({ name: 'Lesezeichen', stories: $bookmarks.filteredStories });

  function handleStorySelect({ id, next }: { id: string; next: boolean }): void {
    const stories = get(bookmarks).stories;
    selectStory.select({ stories, id, next });
  }
</script>

<Content id="bookmarks">
  <BookmarkActions />
  {#if bookmarksAvailable}
    <NewsList storyBuckets={[bookmarksBucket]} isLoading={$bookmarks.isLoading} onSelectStory={handleStorySelect} />
  {:else if $bookmarks.isLoading}
    <NewsListSkeleton />
  {:else}
    <div class={defaultAlertTextBox}>
      <span>Aktuell sind keine Lesezeichen vorhanden.</span>
      <span>
        Du kannst über die Optionen bei einem Artikel in der Übersicht ein Lesezeichen setzen oder oben den Suchtext
        anpassen.
      </span>
    </div>
  {/if}
</Content>
