<script lang="ts">
  import Button from '$lib/components/ui/controls/Button.svelte';
  import ChevronLeft from '$lib/components/ui/icons/outline/ChevronLeft.svelte';
  import ChevronRight from '$lib/components/ui/icons/outline/ChevronRight.svelte';
  import XIcon from '$lib/components/ui/icons/outline/XIcon.svelte';
  import type { StoryImage } from '$lib/models/story';
  import clsx from 'clsx';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  export let image: StoryImage;
  export let images: Array<StoryImage> = [];

  const dispatch = createEventDispatcher();
  const backropClass =
    'flex justify-center items-center fixed top-0 bottom-0 left-0 right-0 z-50 bg-gray-500/50 dark:bg-gray-900/70 backdrop-blur-md';
  const imageClass = 'w-auto h-auto max-w-full max-h-full shadow-2xl';
  const closeButtonClass = 'absolute top-2 right-2 md:top-4 md:right-4 items-center md:w-12 md:h-12';
  const navButtonClass = 'items-center w-[5vw] h-[60dvh]';

  let closeButtonRef: Button;
  let imageRef: HTMLImageElement;
  let oldOverflowValue: string | undefined;

  $: showNavButtons = images.length > 1;
  $: containerClass = clsx([
    showNavButtons && 'grid grid-cols-[repeat(3,_auto)] justify-items-center items-center',
    !showNavButtons && 'flex justify-center items-center',
    'gap-2 px-2 md:gap-4 md:px-4 w-full h-full',
  ]);

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

  function handleImageClick(event: Event): void {
    event.stopPropagation();
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
        imageRef.focus();
      }
    }
  }

  function gotoPrevImage(): void {
    const prev = prevImage(image);
    if (prev) {
      image = prev;

      if (!prevImage(image)) {
        imageRef.focus();
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
    {#if showNavButtons}
      <Button
        class={navButtonClass}
        btnType="monochrome"
        iconOnly
        title="Vorheriges Bild anzeigen"
        disabled={!prevImage(image)}
        on:click={handlePrevImageClick}
      >
        <ChevronLeft />
      </Button>
    {/if}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions a11y-click-events-have-key-events a11y-no-noninteractive-tabindex -->
    <img
      class={imageClass}
      src={image.src}
      srcset={image.srcset}
      alt={image.alt}
      tabindex="0"
      bind:this={imageRef}
      on:click={handleImageClick}
    />
    {#if showNavButtons}
      <Button
        class={navButtonClass}
        btnType="monochrome"
        iconOnly
        title="Vorheriges Bild anzeigen"
        disabled={!nextImage(image)}
        on:click={handleNextImageClick}
      >
        <ChevronRight />
      </Button>
    {/if}
  </div>
</div>
