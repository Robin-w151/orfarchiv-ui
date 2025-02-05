<script lang="ts">
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import Item from '$lib/components/shared/content/Item.svelte';
  import Checkbox from '$lib/components/shared/controls/Checkbox.svelte';
  import settings from '$lib/stores/settings';
  import { requestSystemNotificationPermission } from '$lib/utils/notifications';

  function handleFetchReadMoreContentChange(event: Event & { currentTarget: HTMLInputElement }): void {
    settings.setFetchReadMoreContent(event.currentTarget.checked);
  }

  function handleCheckNewsUpdatesChange(event: Event & { currentTarget: HTMLInputElement }): void {
    const checked = event.currentTarget.checked;
    settings.setCheckNewsUpdates(checked);
    if (checked) {
      requestSystemNotificationPermission();
    }
  }

  function handleForceReducedMotion(event: Event & { currentTarget: HTMLInputElement }): void {
    settings.setForceReducedMotion(event.currentTarget.checked);
  }
</script>

<Section title="Allgemein">
  <SectionList>
    <Item>
      <Checkbox
        id="fetch-read-more-content"
        label="Inhalt von weiterführendem Artikel laden"
        checked={$settings.fetchReadMoreContent}
        onchange={handleFetchReadMoreContentChange}
      />
    </Item>
    <Item>
      <Checkbox
        id="check-news-updates"
        label="Erinnern wenn neue Nachrichten vorhanden sind"
        checked={$settings.checkNewsUpdates}
        onchange={handleCheckNewsUpdatesChange}
      />
    </Item>
    <Item>
      <Checkbox
        id="force-reduce-motion"
        label="Bewegungen reduzieren"
        checked={$settings.forceReducedMotion}
        onchange={handleForceReducedMotion}
      />
    </Item>
  </SectionList>
</Section>
