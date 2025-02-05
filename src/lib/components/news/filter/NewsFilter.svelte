<script lang="ts">
  import Input from '$lib/components/shared/controls/Input.svelte';
  import { startSearch } from '$lib/stores/newsEvents';
  import searchFilter from '$lib/stores/searchFilter';
  import { defaultBackground, defaultPadding } from '$lib/utils/styles';
  import { unsubscribeAll, type Subscription } from '$lib/utils/subscriptions';
  import { onDestroy, onMount } from 'svelte';
  import NewsFilterPopover from '$lib/components/news/filter/NewsFilterPopover.svelte';

  const subscriptions: Array<Subscription> = [];

  const filterClass = `flex gap-2 ${defaultPadding} w-full ${defaultBackground}`;

  let textFilterInputRef: Input | null = $state(null);

  onMount(() => {
    subscriptions.push(startSearch.onUpdate(handleStartSearch));
  });

  onDestroy(() => {
    unsubscribeAll(subscriptions);
  });

  function handleStartSearch() {
    textFilterInputRef?.focus();
  }

  function handleTextFilterChange(textFilter?: string) {
    searchFilter.setTextFilter(textFilter);
  }

  function handleDateFilterFromChange(from?: string) {
    searchFilter.setFrom(from);
  }

  function handleDateFilterToChange(to?: string) {
    searchFilter.setTo(to);
  }
</script>

<div class={filterClass} id="news-filter">
  <Input
    id="text-filter-input"
    value={$searchFilter.textFilter}
    onchange={handleTextFilterChange}
    bind:this={textFilterInputRef}
    placeholder="Suche"
  />
  <NewsFilterPopover
    from={$searchFilter.tempSearchFilter.dateFilter?.from}
    to={$searchFilter.tempSearchFilter.dateFilter?.to}
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
