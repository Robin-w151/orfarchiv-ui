<script lang="ts">
  import Input from '$lib/components/shared/controls/Input.svelte';
  import bookmarks from '$lib/stores/bookmarks';
  import { startSearch } from '$lib/stores/newsEvents';
  import { defaultBackground, defaultPadding } from '$lib/utils/styles';
  import { unsubscribeAll, type Subscription } from '$lib/utils/subscriptions';
  import { onDestroy, onMount } from 'svelte';
  import BookmarkDeletePopover from '$lib/components/news/filter/BookmarkDeletePopover.svelte';
  import { browser } from '$app/environment';
  import { isTouchDevice } from '$lib/utils/support';
  import { isMac } from '$lib/utils/platform';

  const subscriptions: Array<Subscription> = [];

  const filterClass = `flex gap-2 ${defaultPadding} w-full ${defaultBackground}`;

  let textFilterInputRef: Input | null = $state(null);

  const shortcutKeys = $derived.by(() => {
    if (!browser || isTouchDevice()) {
      return undefined;
    }

    return [isMac() ? '⌘' : 'Ctrl', 'K'];
  });

  onMount(() => {
    subscriptions.push(startSearch.onUpdate(handleStartSearch));
  });

  onDestroy(() => {
    unsubscribeAll(subscriptions);
  });

  function handleStartSearch(): void {
    textFilterInputRef?.focus();
  }

  function handleTextFilterChange(textFilter?: string): void {
    bookmarks.setTextFilter(textFilter ?? '');
  }

  function handleDeleteAllBookmarks(): void {
    bookmarks.removeAll();
  }

  function handleDeleteAllViewedBookmarks(): void {
    bookmarks.removeAllViewed();
  }
</script>

<div class={filterClass} id="bookmark-filter">
  <Input
    id="text-filter-input"
    value={$bookmarks.textFilter}
    onValueChange={handleTextFilterChange}
    placeholder="Suche"
    {shortcutKeys}
    bind:this={textFilterInputRef}
  />
  <BookmarkDeletePopover
    onRemoveAllBookmarks={handleDeleteAllBookmarks}
    onRemoveAllViewedBookmarks={handleDeleteAllViewedBookmarks}
  />
</div>
