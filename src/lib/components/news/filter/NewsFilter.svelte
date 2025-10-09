<script lang="ts">
  import { browser } from '$app/environment';
  import NewsFilterPopover from '$lib/components/news/filter/NewsFilterPopover.svelte';
  import Input from '$lib/components/shared/controls/Input.svelte';
  import { startSearch } from '$lib/stores/newsEvents';
  import searchFilter from '$lib/stores/searchFilter';
  import { isMac } from '$lib/utils/platform';
  import { defaultBackground, defaultPadding } from '$lib/utils/styles';
  import { unsubscribeAll, type Subscription } from '$lib/utils/subscriptions';
  import { isTouchDevice } from '$lib/utils/support';
  import { onDestroy, onMount } from 'svelte';

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
    searchFilter.setTextFilter(textFilter);
  }

  function handleDateFilterFromChange(from?: string): void {
    searchFilter.setFrom(from);
  }

  function handleDateFilterToChange(to?: string): void {
    searchFilter.setTo(to);
  }
</script>

<div class={filterClass} id="news-filter">
  <Input
    id="text-filter-input"
    value={$searchFilter.textFilter}
    onValueChange={handleTextFilterChange}
    placeholder="Suche"
    {shortcutKeys}
    bind:this={textFilterInputRef}
  />
  <NewsFilterPopover
    from={$searchFilter.tempDateFilter?.from}
    to={$searchFilter.tempDateFilter?.to}
    onFromChange={handleDateFilterFromChange}
    onToChange={handleDateFilterToChange}
    onApply={searchFilter.applyTempSearchFilter}
    onReset={searchFilter.resetDateFilter}
    onSelectToday={searchFilter.selectDateFilterToday}
    onSelectLastWeek={searchFilter.selectDateFilterLastWeek}
    onSelectLastMonth={searchFilter.selectDateFilterLastMonth}
    onSelectLastYear={searchFilter.selectDateFilterLastYear}
  />
</div>
