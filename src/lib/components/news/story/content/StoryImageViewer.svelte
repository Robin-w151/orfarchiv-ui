<script lang="ts">
  import Button from '$lib/components/ui/controls/Button.svelte';
  import ChevronLeftIcon from '$lib/components/ui/icons/outline/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '$lib/components/ui/icons/outline/ChevronRightIcon.svelte';
  import XIcon from '$lib/components/ui/icons/outline/XIcon.svelte';
  import type { StoryImage } from '$lib/models/story';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  export let image: StoryImage;
  export let images: Array<StoryImage> = [];

  const dispatch = createEventDispatcher();
  const backropClass =
    'flex justify-center items-center fixed top-0 bottom-0 left-0 right-0 z-50 bg-gray-500/50 dark:bg-gray-900/70 backdrop-blur-md';
  const containerClass = 'flex justify-center items-center gap-2 px-2 md:gap-4 md:px-4 w-full h-full';
  const imageContainerClass = 'relative';
  const imageClass = 'w-auto h-auto max-w-full max-h-screen bg-gray-100 dark:bg-gray-300 shadow-2xl';
  const closeButtonClass = 'absolute top-2 right-2 md:top-4 md:right-4 items-center md:w-12 md:h-12';
  const navigationCircleClass =
    'flex justify-center items-center w-12 h-12 md:w-16 md:h-16 text-gray-200 bg-gray-700/30 active:bg-gray-700/70 backdrop-blur-sm rounded-full transition-all ease-out';
  const navigationIconClass = 'w-8 h-8';

  let closeButtonRef: Button;
  let oldOverflowValue: string | undefined;

  $: showNavigation = images.length > 1;

  onMount(() => {
    oldOverflowValue = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeButtonRef.focus();
  });

  onDestroy(() => {
    document.documentElement.style.overflow = oldOverflowValue ?? '';
  });

  function handleCloseButtonClick(): void {
    closeViewer();
  }

  function handleBackdropClick(): void {
    closeViewer();
  }

  function handleBackdropKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    if (key === 'ArrowLeft') {
      gotoPrevImage();
    } else if (key === 'ArrowRight') {
      gotoNextImage();
    } else if (key === 'Escape') {
      event.preventDefault();
      closeViewer();
    }
  }

  function handleNextImageClick(event: Event): void {
    event.stopPropagation();
    gotoNextImage();
  }

  function handlePrevImageClick(event: Event): void {
    event.stopPropagation();
    gotoPrevImage();
  }

  function closeViewer(): void {
    dispatch('close');
  }

  function nextImage(image: StoryImage): StoryImage {
    const index = images.findIndex(({ src }) => src === image.src);
    return images[index + 1];
  }

  function prevImage(image: StoryImage): StoryImage {
    const index = images.findIndex(({ src }) => src === image.src);
    return images[index - 1];
  }

  function gotoNextImage(): void {
    const next = nextImage(image);
    if (next) {
      image = next;

      if (!nextImage(image)) {
        closeButtonRef.focus();
      }
    }
  }

  function gotoPrevImage(): void {
    const prev = prevImage(image);
    if (prev) {
      image = prev;

      if (!prevImage(image)) {
        closeButtonRef.focus();
      }
    }
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class={backropClass} on:click={handleBackdropClick} on:keydown={handleBackdropKeyDown}>
  <Button
    class={closeButtonClass}
    btnType="monochrome"
    iconOnly
    round
    title="Bild schließen"
    bind:this={closeButtonRef}
    on:click={handleCloseButtonClick}
  >
    <XIcon />
  </Button>
  <div class={containerClass}>
    <div class={imageContainerClass}>
      {#if showNavigation}
        {#if prevImage(image)}
          <button class="navigation-button left-2" title="Vorheriges Bild anzeigen" on:click={handlePrevImageClick}>
            <span class={navigationCircleClass}>
              <ChevronLeftIcon class={navigationIconClass} />
            </span>
          </button>
        {/if}
        {#if nextImage(image)}
          <button class="navigation-button right-2" title="Nächstes Bild anzeigen" on:click={handleNextImageClick}>
            <span class={navigationCircleClass}>
              <ChevronRightIcon class={navigationIconClass} />
            </span>
          </button>
        {/if}
      {/if}
      <img class={imageClass} src={image.src} srcset={image.srcset} alt={image.alt} />
    </div>
  </div>
</div>

<style lang="postcss">
  .navigation-button {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: calc(50% - 1.5rem);
    width: 3rem;
    height: 3rem;

    @media (hover: hover) and (pointer: fine) {
      top: calc(50% - 3rem);
      width: 6rem;
      height: 6rem;

      & > span:hover {
        width: 100%;
        height: 100%;
        background-color: theme('colors.gray.900/70');
      }
    }
  }
</style>
