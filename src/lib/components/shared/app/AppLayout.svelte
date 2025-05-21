<script lang="ts">
  import { InfoApi } from '$lib/api/info';
  import { API_VERSION } from '$lib/configs/shared';
  import { setAudioStore } from '$lib/stores/runes/audio.svelte';
  import { setReducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import { setSkeletonStore } from '$lib/stores/runes/skeleton.svelte';
  import { logger } from '$lib/utils/logger';
  import { defaultScreenSize } from '$lib/utils/styles';
  import { onMount, type Snippet } from 'svelte';
  import { pwaInfo } from 'virtual:pwa-info';
  import '../../../../app.scss';
  import AlertBox from '../content/AlertBox.svelte';
  import AudioPlayer from '../content/AudioPlayer.svelte';
  import Header from '../content/Header.svelte';
  import Notifications from '../controls/Notifications.svelte';
  import EnableAnalytics from './EnableAnalytics.svelte';
  import EnableDarkMode from './EnableDarkMode.svelte';
  import EnableGlobalKeybindings from './EnableGlobalKeybindings.svelte';
  import EnableNetworkNotifications from './EnableNetworkNotifications.svelte';
  import EnableUpdateListener from './EnableUpdateListener.svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  setReducedMotionStore();
  setSkeletonStore();
  setAudioStore();

  const infoApi = new InfoApi();

  const wrapperClass = `
    flex flex-col gap-2 lg:gap-3
    p-2 pb-20 lg:p-4 lg:pb-20
    ${defaultScreenSize}
  `;
  const mainClass = 'flex flex-col gap-2 lg:gap-3';

  let isApiCompatible = $state(true);
  let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

  onMount(() => {
    document.documentElement.setAttribute('data-test', 'ready');

    checkApiVersion();
  });

  async function checkApiVersion(): Promise<void> {
    try {
      const { apiVersion } = await infoApi.fetchInfo();
      isApiCompatible = apiVersion !== undefined && API_VERSION === apiVersion;
    } catch (_error) {
      logger.warn('Could not determine current API version!');
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
    <AudioPlayer />
    <main class={mainClass}>
      {@render children?.()}
    </main>
  {:else}
    <AlertBox
      title="Veraltete Version"
      message="Diese Version ist veraltet und nicht mehr kompatibel. Bitte schließen Sie alle Tabs und öffnen dann ORF Archiv erneut."
    ></AlertBox>
  {/if}
</div>
