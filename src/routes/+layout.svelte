<script lang="ts">
  import { fetchInfo } from '$lib/api/info';
  import Header from '$lib/components/ui/content/Header.svelte';
  import Notifications from '$lib/components/ui/controls/Notifications.svelte';
  import EnableAnalytics from '$lib/components/utils/EnableAnalytics.svelte';
  import EnableDarkMode from '$lib/components/utils/EnableDarkMode.svelte';
  import EnableGlobalKeybindings from '$lib/components/utils/EnableGlobalKeybindings.svelte';
  import EnableNetworkNotifications from '$lib/components/utils/EnableNetworkNotifications.svelte';
  import EnableUpdateListener from '$lib/components/utils/EnableUpdateListener.svelte';
  import { defaultAlertTextBox, defaultScreenSize } from '$lib/utils/styles';
  import { onMount } from 'svelte';
  import { pwaInfo } from 'virtual:pwa-info';
  import '../app.scss';
  import { API_VERSION } from '$lib/configs/shared';

  const wrapperClass = `
    flex flex-col gap-2 lg:gap-3
    p-2 pb-6 lg:p-4 lg:pb-6
    ${defaultScreenSize}
  `;
  const mainClass = 'flex flex-col gap-2 lg:gap-3';

  let isApiCompatible = true;

  $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

  onMount(() => {
    document.documentElement.setAttribute('data-test', 'ready');

    checkApiVersion();
  });

  async function checkApiVersion(): Promise<void> {
    try {
      const { apiVersion } = await fetchInfo();
      isApiCompatible = apiVersion !== undefined && API_VERSION === apiVersion;
    } catch (_error) {
      console.warn('Could not determine current API version!');
    }
  }
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html webManifestLink}
</svelte:head>

<EnableDarkMode />
<EnableAnalytics />
<EnableGlobalKeybindings />
<EnableNetworkNotifications />
<EnableUpdateListener />

<div class={wrapperClass}>
  <Notifications />
  <Header />

  {#if isApiCompatible}
    <main class={mainClass}>
      <slot />
    </main>
  {:else}
    <div class={defaultAlertTextBox}>
      <strong>Veraltete Version</strong>
      <span
        >Diese Version ist veraltet und nicht mehr kompatibel. Bitte schließen Sie alle Tabs und öffnen dann ORF Archiv
        erneut.
      </span>
    </div>
  {/if}
</div>
