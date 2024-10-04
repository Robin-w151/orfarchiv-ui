<script lang="ts">
  import Header from '$lib/components/ui/content/Header.svelte';
  import Notifications from '$lib/components/ui/controls/Notifications.svelte';
  import EnableAnalytics from '$lib/components/utils/EnableAnalytics.svelte';
  import EnableDarkMode from '$lib/components/utils/EnableDarkMode.svelte';
  import EnableGlobalKeybindings from '$lib/components/utils/EnableGlobalKeybindings.svelte';
  import EnableNetworkNotifications from '$lib/components/utils/EnableNetworkNotifications.svelte';
  import EnableUpdateListener from '$lib/components/utils/EnableUpdateListener.svelte';
  import { defaultScreenSize } from '$lib/utils/styles';
  import { onMount } from 'svelte';
  import '../app.scss';
  import { pwaInfo } from 'virtual:pwa-info';

  const wrapperClass = `
    flex flex-col gap-2 lg:gap-3
    p-2 pb-6 lg:p-4 lg:pb-6
    ${defaultScreenSize}
  `;
  const mainClass = 'flex flex-col gap-2 lg:gap-3';

  $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

  onMount(() => {
    document.documentElement.setAttribute('data-test', 'ready');
  });
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
  <main class={mainClass}>
    <slot />
  </main>
</div>
