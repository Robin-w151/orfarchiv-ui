<script lang="ts">
  import { getSourceLabel } from '$lib/models/settings';
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { formatTimestamp } from '$lib/utils/datetime';

  const audioStore = getAudioStore();
  const sourceLabel = $derived(getSourceLabel(audioStore.story?.source));

  const titleClass = ['flex flex-col flex-1 items-start'];
  const metadataClass = ['flex flex-wrap items-center gap-x-1 text-sm text-gray-600 dark:text-gray-300'];
</script>

{const story = $derived(audioStore.story)}
{#if story}
  <div class={titleClass}>
    <h3>
      <span>{story.title}</span>
    </h3>
    <span class={metadataClass}>
      <span>{story.category ?? 'Keine Kategorie'}</span>
      {#if sourceLabel}
        <span>({sourceLabel})</span>
      {/if}
      <span>{formatTimestamp(story.timestamp)}</span></span
    >
  </div>
{/if}
