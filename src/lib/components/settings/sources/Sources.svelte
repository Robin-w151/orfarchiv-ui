<script lang="ts">
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import Item from '$lib/components/shared/content/Item.svelte';
  import Checkbox from '$lib/components/shared/controls/Checkbox.svelte';
  import settings from '$lib/stores/settings';
  import { sources } from '$lib/models/settings.js';

  function handleSourceChange(source: string, event: Event & { currentTarget: HTMLInputElement }): void {
    settings.setSource(source, event.currentTarget.checked);
  }
</script>

<Section title="Quellen">
  <SectionList>
    {#each sources as { label, key } (key)}
      <Item>
        <Checkbox
          id={`source-${key}`}
          {label}
          checked={$settings.sources?.includes(key)}
          onchange={handleSourceChange.bind(null, key)}
        />
      </Item>
    {/each}
  </SectionList>
</Section>
