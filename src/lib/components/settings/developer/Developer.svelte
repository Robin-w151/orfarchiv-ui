<script lang="ts">
  import { browser } from '$app/environment';
  import Item from '$lib/components/shared/content/Item.svelte';
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { BOOKMARKS_STORE_NAME } from '$lib/configs/client';
  import { humanReadableMemorySize } from '$lib/utils/formatting';
  import { onMount } from 'svelte';

  let estimatedStorageUsage: number | undefined = $state(0);
  let estimatedStorageUsageString = $derived(
    estimatedStorageUsage ? humanReadableMemorySize(estimatedStorageUsage) : 'Unbekannt',
  );

  onMount(async () => {
    estimatedStorageUsage = await getEstimatedUsage();
  });

  function getNotificationSupport(): string {
    if (!browser || !('Notification' in window)) {
      return 'Nicht verfügbar';
    }

    switch (Notification.permission) {
      case 'default':
        return 'Verfügbar';
      case 'denied':
        return 'Deaktiviert';
      case 'granted':
        return 'Aktiviert';
    }
  }

  function isEstimateSupported(): boolean {
    return browser && 'storage' in navigator && navigator.storage && 'estimate' in navigator.storage;
  }

  async function getEstimatedUsage(): Promise<number | undefined> {
    if (!isEstimateSupported()) {
      return;
    }

    const estimate = await navigator.storage.estimate();
    return estimate.usage;
  }

  function handleResetIndexedDbButtonClick(): void {
    indexedDB.deleteDatabase(BOOKMARKS_STORE_NAME);
    location.reload();
  }

  function handleResetLocalStorageButtonClick(): void {
    localStorage.clear();
    location.reload();
  }
</script>

<Section title="Entwickler">
  <SectionList>
    <Item noColumn>
      <span>Benachrichtigungen</span>
      <span>{getNotificationSupport()}</span>
    </Item>
    <Item noColumn>
      <span>Speichernutzung</span>
      <span>{estimatedStorageUsageString}</span>
    </Item>
    <Item noColumn>
      <span>IndexedDB</span>
      <Button size="small" onclick={handleResetIndexedDbButtonClick}>Zurücksetzen</Button>
    </Item>
    <Item noColumn>
      <span>LocalStorage</span>
      <Button size="small" onclick={handleResetLocalStorageButtonClick}>Zurücksetzen</Button>
    </Item>
  </SectionList>
</Section>
