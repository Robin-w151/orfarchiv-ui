<script lang="ts">
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import Item from '$lib/components/shared/content/Item.svelte';
  import Radio from '$lib/components/shared/controls/Radio.svelte';
  import styles, { type ColorScheme } from '$lib/stores/styles';
  import { getReducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import { runViewTransition } from '$lib/utils/viewTransition';

  const reducedMotionStore = getReducedMotionStore();

  let colorScheme: ColorScheme = $state($styles.colorScheme);

  function handleColorSchemeRadioChange(): void {
    if (colorScheme) {
      runViewTransition(
        () => {
          styles.setColorScheme(colorScheme);
        },
        {
          useReducedMotion: reducedMotionStore.useReducedMotion,
        },
      );
    }
  }
</script>

<Section title="Darstellung">
  <SectionList>
    <Item>
      <Radio
        id="color-scheme-system"
        name="color-scheme"
        label="Automatisch"
        value="system"
        bind:group={colorScheme}
        onchange={handleColorSchemeRadioChange}
      />
    </Item>
    <Item>
      <Radio
        id="color-scheme-light"
        name="color-scheme"
        label="Hell"
        value="light"
        bind:group={colorScheme}
        onchange={handleColorSchemeRadioChange}
      />
    </Item>
    <Item>
      <Radio
        id="color-scheme-dark"
        name="color-scheme"
        label="Dunkel"
        value="dark"
        bind:group={colorScheme}
        onchange={handleColorSchemeRadioChange}
      />
    </Item>
  </SectionList>
</Section>
