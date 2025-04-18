<script lang="ts">
  import { PUBLIC_APP_MODE } from '$env/static/public';
  import Appearance from '$lib/components/settings/appearance/Appearance.svelte';
  import Content from '$lib/components/shared/content/Content.svelte';
  import { audioStore } from '$lib/stores/runes/audio.svelte';
  import { defaultGap } from '$lib/utils/styles';
  import AI from './ai/AI.svelte';
  import Audio from './audio/Audio.svelte';
  import Developer from './developer/Developer.svelte';
  import General from './general/General.svelte';
  import Info from './info/Info.svelte';
  import Sources from './sources/Sources.svelte';

  const gridClass = `
    grid grid-cols-auto sm:grid-cols-[1fr_1fr] ${defaultGap}
    w-full
  `;
  const columnClass = `
    flex flex-col items-center ${defaultGap}
  `;
</script>

<Content>
  <div class={gridClass}>
    <div class={columnClass}>
      <General />
      <Appearance />
      {#if audioStore.isAvailable}
        <Audio />
      {/if}
      <AI />
      <Info />
    </div>
    <div class={columnClass}>
      <Sources />
      {#if PUBLIC_APP_MODE === 'dev'}
        <Developer />
      {/if}
    </div>
  </div>
</Content>
