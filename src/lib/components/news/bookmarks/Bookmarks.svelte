<script lang="ts">
  import NewsListSkeleton from '$lib/components/news/NewsListSkeleton.svelte';
  import AlertBox from '$lib/components/shared/content/AlertBox.svelte';
  import Content from '$lib/components/shared/content/Content.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import bookmarks from '$lib/stores/bookmarks';
  import { selectStory } from '$lib/stores/newsEvents';
  import { get } from 'svelte/store';
  import BookmarkActions from '../filter/BookmarkActions.svelte';
  import NewsList from '../NewsList.svelte';

  let bookmarksAvailable = $derived($bookmarks.filteredStories?.length > 0);
  let bookmarksBucket = $derived({ name: 'Lesezeichen', stories: $bookmarks.filteredStories });

  function handleStorySelect({ id, next }: { id: string; next: boolean }): void {
    const stories = get(bookmarks).stories;
    selectStory.select({ stories, id, next });
  }

  function handleResetFilterClick(): void {
    bookmarks.resetAllFilters();
  }
</script>

<Content id="bookmarks">
  <BookmarkActions />
  {#if bookmarksAvailable}
    <NewsList storyBuckets={[bookmarksBucket]} isLoading={$bookmarks.isLoading} onSelectStory={handleStorySelect} />
  {:else if $bookmarks.isLoading}
    <NewsListSkeleton />
  {:else}
    <AlertBox
      title="Keine Lesezeichen vorhanden"
      message="Du kannst über die Optionen bei einem Artikel in der Übersicht ein Lesezeichen setzen oder oben den Suchtext anpassen."
    >
      {#snippet actionsContent()}
        {#if $bookmarks.textFilter}
          <Button class="w-max" btnType="secondary" onclick={handleResetFilterClick}>Filter zurücksetzen</Button>
        {/if}
      {/snippet}
    </AlertBox>
  {/if}
</Content>
