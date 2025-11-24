<script lang="ts">
  import Item from '$lib/components/shared/content/Item.svelte';
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import Radio from '$lib/components/shared/controls/Radio.svelte';
  import { getReducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import styles, { type ColorScheme } from '$lib/stores/styles';
  import { isViewTransitionInProgress, runViewTransition } from '$lib/utils/viewTransition';

  const reducedMotionStore = getReducedMotionStore();
  const appearanceOptions = [
    {
      id: 'color-scheme-system',
      label: 'Automatisch',
      value: 'system',
    },
    {
      id: 'color-scheme-light',
      label: 'Hell',
      value: 'light',
    },
    {
      id: 'color-scheme-dark',
      label: 'Dunkel',
      value: 'dark',
    },
  ];

  let colorScheme: ColorScheme = $state($styles.colorScheme);

  function handleColorSchemeRadioChange(_value: string): void {
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

  function handleColorSchemeRadioClick(event: MouseEvent): void {
    if (isViewTransitionInProgress()) {
      event.preventDefault();
    }
  }

  function handleColorSchemeRadioKeydown(event: KeyboardEvent): void {
    if (isViewTransitionInProgress()) {
      event.preventDefault();
    }
  }
</script>

<Section title="Darstellung">
  <SectionList>
    {#each appearanceOptions as option (option.id)}
      <Item>
        <Radio
          id={option.id}
          name="color-scheme"
          label={option.label}
          value={option.value}
          bind:group={colorScheme}
          onchange={handleColorSchemeRadioChange.bind(null, option.value)}
          onclick={handleColorSchemeRadioClick}
          onkeydown={handleColorSchemeRadioKeydown}
        />
      </Item>
    {/each}
  </SectionList>
</Section>
