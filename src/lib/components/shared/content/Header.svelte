<script lang="ts">
  import { page } from '$app/state';
  import { NewsApi } from '$lib/api/news';
  import TextGradient from '$lib/components/shared/content/TextGradient.svelte';
  import ButtonLink from '$lib/components/shared/controls/ButtonLink.svelte';
  import { NOTIFICATION_OFFLINE_CACHE_DOWNLOADED } from '$lib/configs/client';
  import news from '$lib/stores/news';
  import { refreshNews } from '$lib/stores/newsEvents';
  import notifications from '$lib/stores/notifications';
  import { defaultPadding } from '$lib/utils/styles';
  import { ArrowPath, BookmarkSquare, CloudArrowDown, Cog8Tooth, Newspaper } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import Button from '../controls/Button.svelte';

  const newsApi = new NewsApi();

  const headerClass = `
    flex justify-between items-center gap-6
    ${defaultPadding}
    text-2xl sm:text-3xl
    text-blue-700 bg-white dark:bg-gray-900
  `;
  const headerTitleClass = 'focus:bg-blue-100 dark:focus:bg-blue-900 outline-none rounded-md';
  const headerActionsClass = 'flex gap-2';

  let isNewsPage = $derived(page.url.pathname === '/');

  function handleRefreshButtonClick(): void {
    refreshNews.notify();
  }

  async function handleCacheForOfflineUseClick(): Promise<void> {
    notifications.notify('Download gestartet', 'Die neuesten Artikel werden für später geladen.', {
      uniqueCategory: NOTIFICATION_OFFLINE_CACHE_DOWNLOADED,
      replaceInCategory: true,
      forceAppNotification: true,
    });
    await news.cacheForOfflineUse(newsApi.fetchContent.bind(newsApi));
    notifications.notify('Download abgeschlossen', 'Die neuesten Artikel wurden für später gespeichert.', {
      uniqueCategory: NOTIFICATION_OFFLINE_CACHE_DOWNLOADED,
      replaceInCategory: true,
      forceAppNotification: true,
    });
  }
</script>

<header class={headerClass}>
  <h1>
    <a class={headerTitleClass} href="/" title="Startseite" data-sveltekit-preload-code="hover">
      <TextGradient>ORF Archiv</TextGradient>
    </a>
  </h1>
  <nav class={headerActionsClass}>
    {#if isNewsPage}
      <ButtonLink href="/" title="Aktualisieren" iconOnly onclick={handleRefreshButtonClick} preventDefault>
        <Icon src={ArrowPath} theme="outlined" class="size-6" />
      </ButtonLink>
      <Button
        title="Artikel offline verfügbar machen"
        iconOnly
        btnType="secondary"
        onclick={handleCacheForOfflineUseClick}
      >
        <Icon src={CloudArrowDown} theme="outlined" class="size-6" />
      </Button>
    {:else}
      <ButtonLink href="/" title="News" iconOnly prefetch>
        <Icon src={Newspaper} theme="outlined" class="size-6" />
      </ButtonLink>
    {/if}
    <ButtonLink href="/bookmarks" title="Lesezeichen" iconOnly prefetch>
      <Icon src={BookmarkSquare} theme="outlined" class="size-6" />
    </ButtonLink>
    <ButtonLink href="/settings" title="Einstellungen" iconOnly prefetch>
      <Icon src={Cog8Tooth} theme="outlined" class="size-6" />
    </ButtonLink>
  </nav>
</header>
