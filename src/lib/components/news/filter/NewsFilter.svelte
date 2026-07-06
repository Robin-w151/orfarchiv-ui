<script lang="ts">
  import { browser } from '$app/env';
  import Input from '$lib/components/shared/controls/Input.svelte';
  import type { SearchMatchMode } from '$lib/models/searchRequest';
  import { startSearch } from '$lib/stores/newsEvents';
  import searchFilter from '$lib/stores/searchFilter';
  import { isMac } from '$lib/utils/platform';
  import { defaultBackground, defaultPadding } from '$lib/utils/styles';
  import { unsubscribeAll, type Subscription } from '$lib/utils/subscriptions';
  import { isTouchDevice } from '$lib/utils/support';
  import { onDestroy, onMount } from 'svelte';
  import NewsFilterMenuPopover from './NewsFilterMenuPopover.svelte';
  import NewsFilterTagPopover from './NewsFilterTagPopover.svelte';

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

  function handleSelectTag(tag: string): void {
    searchFilter.setTag(tag);
  }

  function handleRemoveTag(): void {
    searchFilter.resetTag();
  }

  function handleTextFilterChange(textFilter?: string): void {
    searchFilter.setTextFilter(textFilter);
  }

  function handleDateFilterFromChange(from?: string): void {
    searchFilter.setFrom(from);
  }

  function handleDateFilterToChange(to?: string): void {
    searchFilter.setTo(to);
  }

  function handleMatchModeChange(matchMode: SearchMatchMode): void {
    searchFilter.setMatchMode(matchMode);
  }
</script>

<div class={filterClass} id="news-filter">
  <Input
    id="text-filter-input"
    value={$searchFilter.textFilter}
    tag={$searchFilter.tag}
    onValueChange={handleTextFilterChange}
    onTagRemove={handleRemoveTag}
    placeholder="Suche"
    {shortcutKeys}
    bind:this={textFilterInputRef}
  />
  <NewsFilterTagPopover onSelectTag={handleSelectTag} />
  <NewsFilterMenuPopover
    from={$searchFilter.temp?.dateFilter?.from}
    to={$searchFilter.temp?.dateFilter?.to}
    matchMode={$searchFilter.temp?.matchMode}
    onFromChange={handleDateFilterFromChange}
    onToChange={handleDateFilterToChange}
    onMatchModeChange={handleMatchModeChange}
    onApply={searchFilter.applyTempSearchFilter}
    onReset={searchFilter.resetTempFilters}
    onSelectToday={searchFilter.selectDateFilterToday}
    onSelectLastWeek={searchFilter.selectDateFilterLastWeek}
    onSelectLastMonth={searchFilter.selectDateFilterLastMonth}
    onSelectLastYear={searchFilter.selectDateFilterLastYear}
  />
</div>
