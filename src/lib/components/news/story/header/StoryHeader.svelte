<script lang="ts">
  import StoryPopover from '$lib/components/news/story/header/options/StoryPopover.svelte';
  import { getSourceLabel } from '$lib/models/settings';
  import type { Story } from '$lib/models/story';
  import { formatTimestamp } from '$lib/utils/datetime.js';
  import type { KeyboardEventHandler, MouseEventHandler } from 'svelte/elements';

  interface Props {
    story: Story;
    onclick?: MouseEventHandler<HTMLElement>;
    onkeydown?: KeyboardEventHandler<HTMLElement>;
  }

  let { story, onclick, onkeydown }: Props = $props();

  const headerClass = `
    w-full
    focus:text-blue-700 dark:focus:text-blue-500
    outline-none
  `;
  const infoClass = `
    flex flex-col flex-1 items-start
  `;
  const metadataClass = 'flex flex-wrap items-center gap-x-1 text-sm text-gray-600 dark:text-gray-400';
  const viewedBadge = `
    float-right
    mt-1 ml-2 px-1 py-px
    text-sm
    bg-blue-700 text-white
    rounded-sm
  `;

  let headerRef: HTMLHeadElement | undefined = $state();

  export function focus(): void {
    headerRef?.focus();
  }

  let showViewedInfo = $derived(story?.isBookmarked && story?.isViewed);
  let sourceLabel = $derived(getSourceLabel(story?.source));
</script>

{#if story}
  <header class={headerClass} role="button" tabindex="0" {onclick} {onkeydown} bind:this={headerRef}>
    {#if showViewedInfo}
      <span class={viewedBadge}>Gelesen</span>
    {/if}
    <div class={infoClass}>
      <h3>
        <span>{story.title}</span>
      </h3>
      <span class={metadataClass}>
        <span>{story.category ?? 'Keine Kategorie'}</span>
        {#if sourceLabel}<span>({sourceLabel})</span>{/if}
        <span>{formatTimestamp(story.timestamp)}</span></span
      >
    </div>
  </header>
  <StoryPopover {story} />
{/if}
