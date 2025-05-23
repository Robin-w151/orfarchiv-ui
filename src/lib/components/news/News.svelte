<script lang="ts">
  import { NewsApi } from '$lib/api/news';
  import NewsFilter from '$lib/components/news/filter/NewsFilter.svelte';
  import Content from '$lib/components/shared/content/Content.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import {
    NEWS_CHECK_UPDATES_INITIAL_INTERVAL_IN_MS,
    NEWS_CHECK_UPDATES_INTERVAL_IN_MS,
    NOTIFICATION_NEWS_UPDATES_AVAILABLE,
  } from '$lib/configs/client';
  import type { News } from '$lib/models/news';
  import type { SearchRequestParameters } from '$lib/models/searchRequest';
  import type { Settings } from '$lib/models/settings';
  import news from '$lib/stores/news';
  import { loadMoreNews, refreshNews, selectStory } from '$lib/stores/newsEvents';
  import notifications from '$lib/stores/notifications';
  import searchFilter from '$lib/stores/searchFilter';
  import searchRequestParameters from '$lib/stores/searchRequestParameters';
  import settings from '$lib/stores/settings';
  import { logger } from '$lib/utils/logger';
  import { unsubscribeAll, type Subscription } from '$lib/utils/subscriptions';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import AlertBox from '../shared/content/AlertBox.svelte';
  import ButtonLink from '../shared/controls/ButtonLink.svelte';
  import SpinningDotsIndicator from '../shared/loading/SpinningDotsIndicator.svelte';
  import NewsList from './NewsList.svelte';
  import NewsListSkeleton from './NewsListSkeleton.svelte';

  const newsApi = new NewsApi();
  const subscriptions: Array<Subscription> = [];

  let checkUpdatesTimeout: any;
  let showNewsList = $derived(hasNews($news as News));
  let anySourcesEnabled = $derived(hasAnySourcesEnabled($settings as Settings));
  let loadMoreButtonDisabled = $derived($news.nextKey === null);

  onMount(async () => {
    subscriptions.push(refreshNews.onUpdate(fetchNewNews));
    subscriptions.push(loadMoreNews.onUpdate(fetchMoreNews));
    subscriptions.push(searchRequestParameters.subscribe(fetchNews));
  });

  onDestroy(() => {
    unsubscribeAll(subscriptions);
    clearTimeout(checkUpdatesTimeout);
  });

  async function fetchNews(searchRequestParameters: SearchRequestParameters): Promise<void> {
    await news.taskWithLoading(async () => {
      const foundNews = await newsApi.searchNews(searchRequestParameters);
      if (!foundNews?.prevKey) {
        news.setNews(foundNews);
        return;
      }

      const newNews = await newsApi.searchNews(searchRequestParameters, foundNews?.prevKey);
      news.setNews(foundNews, newNews);
    });

    setCheckUpdatesTimeout(true);
  }

  async function fetchNewNews(): Promise<void> {
    await news.taskWithLoading(async () => {
      const currSearchRequestParameters = get(searchRequestParameters);
      const prevKey = get(news).prevKey;
      if (!prevKey) {
        return;
      }
      const newNews = await newsApi.searchNews(currSearchRequestParameters, prevKey);
      news.addNews(newNews, false);
    });

    setCheckUpdatesTimeout(true);
  }

  async function fetchMoreNews(): Promise<void> {
    await news.taskWithLoading(async () => {
      const currSearchRequestParameters = get(searchRequestParameters);
      const nextKey = get(news).nextKey;
      if (nextKey === null) {
        return;
      }
      const newNews = await newsApi.searchNews(currSearchRequestParameters, nextKey);
      news.addNews(newNews);
    });
  }

  async function fetchNewsUpdates(): Promise<void> {
    const currSearchRequestParameters = get(searchRequestParameters);
    const prevKey = get(news).prevKey;
    if (!prevKey) {
      return;
    }

    try {
      const newsUpdates = await newsApi.checkNewsUpdates(currSearchRequestParameters, prevKey);
      if (newsUpdates.updateAvailable) {
        notifications.notify('Neue Nachrichten verfügbar', 'Wollen Sie jetzt neu laden?', {
          uniqueCategory: NOTIFICATION_NEWS_UPDATES_AVAILABLE,
          requiredPathForFocus: '/',
          onAccept: () => {
            fetchNewNews();
          },
          onClose: () => {
            setCheckUpdatesTimeout(true);
          },
        });
      } else {
        setCheckUpdatesTimeout(false);
      }
    } catch (_) {
      logger.info('Checking if new news updates are available failed.');
    }
  }

  function cancelRequests(): void {
    newsApi.cancelSearchNews();
    newsApi.cancelCheckNewsUpdates();
  }

  function setCheckUpdatesTimeout(initial: boolean): void {
    if (!$settings.checkNewsUpdates) {
      return;
    }

    clearTimeout(checkUpdatesTimeout);

    checkUpdatesTimeout = setTimeout(
      fetchNewsUpdates,
      initial ? NEWS_CHECK_UPDATES_INITIAL_INTERVAL_IN_MS : NEWS_CHECK_UPDATES_INTERVAL_IN_MS,
    );
  }

  function hasNews(news?: News): boolean {
    return !!news?.storyBuckets && news.storyBuckets.reduce((count, bucket) => count + bucket.stories.length, 0) > 0;
  }

  function hasAnySourcesEnabled(settings?: Settings): boolean {
    return !settings || !settings.sources || settings.sources.length > 0;
  }

  function handleLoadMoreClick(): void {
    loadMoreNews.notify();
  }

  function handleStorySelect({ id, next }: { id: string; next: boolean }): void {
    const stories = get(news).stories;
    selectStory.select({ stories, id, next });
  }

  function handleTryAgainClick(): void {
    fetchNews(get(searchRequestParameters));
  }

  function handleResetFilterClick(): void {
    searchFilter.resetAll();
  }

  function handleLoadingIndicatorBackdropClick(): void {
    cancelRequests();
  }

  function handleLoadingIndicatorBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelRequests();
    }
  }
</script>

<Content id="news">
  <NewsFilter />
  {#if !anySourcesEnabled}
    <AlertBox
      title="Keine Quellen aktiviert"
      message="Gehen Sie zu den Einstellungen und aktivieren Sie mindestens eine Quelle um Nachrichten zu sehen."
    >
      {#snippet actionsContent()}
        <ButtonLink class="w-max" href="/settings">Zu den Einstellungen</ButtonLink>
      {/snippet}
    </AlertBox>
  {:else if showNewsList}
    <NewsList storyBuckets={$news.storyBuckets} isLoading={$news.isLoading} onSelectStory={handleStorySelect} />
  {:else if $news.isLoading}
    <NewsListSkeleton />
  {:else}
    <AlertBox
      title="Keine Nachrichten gefunden"
      message="Bitte versuchen Sie es später erneut oder ändern Sie die Filter."
    >
      {#snippet actionsContent()}
        <Button class="w-max" btnType="secondary" onclick={handleTryAgainClick}>Erneut versuchen</Button>
        <Button class="w-max" btnType="secondary" onclick={handleResetFilterClick}>Filter zurücksetzen</Button>
      {/snippet}
    </AlertBox>
  {/if}
  {#if showNewsList}
    <Button disabled={loadMoreButtonDisabled} onclick={handleLoadMoreClick}>Weitere laden</Button>
  {/if}
</Content>

{#if $news.isLoading}
  <SpinningDotsIndicator
    delay={2000}
    onclick={handleLoadingIndicatorBackdropClick}
    onkeydown={handleLoadingIndicatorBackdropKeydown}
  />
{/if}
