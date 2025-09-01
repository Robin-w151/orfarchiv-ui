<script lang="ts">
  import StoryContent from '$lib/components/news/story/content/StoryContent.svelte';
  import StoryHeader from '$lib/components/news/story/header/StoryHeader.svelte';
  import Item from '$lib/components/shared/content/Item.svelte';
  import AccessibleTransition from '$lib/components/shared/transitions/AccessibleTransition.svelte';
  import type { Story } from '$lib/models/story';
  import { selectStory } from '$lib/stores/newsEvents';
  import { defaultPadding } from '$lib/utils/styles';
  import { unsubscribeAll, type Subscription } from '$lib/utils/subscriptions';
  import { rollDown } from '$lib/utils/transitions';
  import clsx from 'clsx';
  import { onDestroy, onMount, tick } from 'svelte';

  interface Props {
    story: Story;
    onSelectStory?: ({ id, next }: { id: string; next: boolean }) => void;
  }

  let { story, onSelectStory }: Props = $props();

  const subscriptions: Array<Subscription> = [];

  const headerClass = `
    flex flex-row items-center gap-3 top-[47px] sm:top-[53px] sticky z-10
    ${defaultPadding}
    text-gray-800 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-500
    border-gray-200 dark:border-gray-700
    cursor-pointer
    transition
  `;
  const contentClass = `${defaultPadding} mt-[2px] cursor-auto`;

  let itemRef: Item | undefined = $state();
  let headerRef: StoryHeader | undefined = $state();
  let showContentInitial = false;
  let showContent = $state(false);
  let headerClassOpen = $derived(clsx([showContent && 'mb-[-2px] border-solid border-b-2 bg-white dark:bg-gray-900']));

  $effect(() => {
    handleContentViewCollapse(showContent);
  });

  onMount(() => {
    subscriptions.push(selectStory.subscribe(handleStorySelect));
  });

  onDestroy(() => {
    unsubscribeAll(subscriptions);
  });

  function scrollIntoView(): void {
    tick().then(() => itemRef?.scrollIntoView());
  }

  function toggleShowContent(): void {
    showContent = !showContent;
  }

  function handleStoryContentCollapse(): void {
    toggleShowContent();
  }

  function handleContentViewCollapse(showContent: boolean): void {
    if (showContentInitial && !showContent) {
      scrollIntoView();
    }

    if (!showContentInitial) {
      showContentInitial = true;
    }
  }

  function handleHeaderWrapperClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      toggleShowContent();
    }
  }

  function handleHeaderClick(): void {
    toggleShowContent();
  }

  function handleHeaderKeydown(event: KeyboardEvent): void {
    const { code, ctrlKey, metaKey } = event;
    if (code === 'Enter' || code === 'Space') {
      event.preventDefault();
      toggleShowContent();
    }
    if (code === 'ArrowUp' && (ctrlKey || metaKey)) {
      event.preventDefault();
      onSelectStory?.({ id: story.id, next: false });
    }
    if (code === 'ArrowDown' && (ctrlKey || metaKey)) {
      event.preventDefault();
      onSelectStory?.({ id: story.id, next: true });
    }
  }

  function handleStorySelect(storyId?: string): void {
    if (story.id === storyId) {
      headerRef?.focus();
      scrollIntoView();
    }
  }
</script>

<Item bind:this={itemRef} noGap noPadding>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="header {headerClass} {headerClassOpen}" onclick={handleHeaderWrapperClick}>
    <StoryHeader {story} onclick={handleHeaderClick} onkeydown={handleHeaderKeydown} bind:this={headerRef} />
  </div>
  {#if showContent}
    <AccessibleTransition class="content {contentClass}" transition={rollDown} onlyIn>
      <StoryContent {story} onCollapse={handleStoryContentCollapse} />
    </AccessibleTransition>
  {/if}
</Item>
