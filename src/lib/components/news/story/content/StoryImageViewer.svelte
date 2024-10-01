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
  const closeButtonClass = 'absolute top-4 right-4 items-center md:w-20 md:h-20';
  const navButtonClass = 'items-center h-64 md:w-20 xl:w-36 xl:h-96';

  let closeButtonRef: Button;
  let oldOverflowValue: string | undefined;

  $: showNavButtons = images.length > 1;
  $: containerClass = clsx([
    showNavButtons && 'grid grid-cols-[auto_1fr_auto] justify-items-center items-center',
    !showNavButtons && 'flex justify-center items-center',
    'gap-2 p-2 md:gap-4 md:p-4 w-full h-full',
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
    }
  }

  function gotoPrevImage(): void {
    const prev = prevImage(image);
    if (prev) {
      image = prev;
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
    <img class={imageClass} src={image.src} srcset={image.srcset} alt={image.alt} />
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
