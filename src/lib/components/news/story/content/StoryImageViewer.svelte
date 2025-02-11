<script lang="ts">
  import ChevronLeftIcon from '$lib/components/shared/icons/outline/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '$lib/components/shared/icons/outline/ChevronRightIcon.svelte';
  import XIcon from '$lib/components/shared/icons/outline/XIcon.svelte';
  import type { StoryImage } from '$lib/models/story';
  import { onDestroy, onMount } from 'svelte';
  import type { PanzoomObject } from '@panzoom/panzoom';
  import { Panzoom } from '$lib/utils/panzoomModule';
  import { isMacOsPlatform, isTouchDevice } from '$lib/utils/support';
  interface Props {
    image: StoryImage;
    images?: Array<StoryImage>;
    onClose?: () => void;
  }

  let { image = $bindable(), images = [], onClose }: Props = $props();

  let showControls = $state(true);
  let closeButtonRef: HTMLButtonElement | undefined = $state();
  let oldOverflowValue: string | undefined;
  let oldActiveElement: Element | null;
  let imageRef = $state<HTMLImageElement | undefined>();
  let panzoom: PanzoomObject | undefined;
  let prevPanzoomPosition: { x: number; y: number } | undefined;

  let isNavigationEnabled = $derived(images.length > 1);
  let viewerButtonClass = $derived(`${showControls ? 'visible' : 'invisible'}`);

  const containerClass = 'flex justify-center items-center fixed top-0 bottom-0 left-0 right-0 z-50';
  const imageContainerClass = 'w-full h-full bg-black';
  const imageClass = 'object-scale-down w-full h-full bg-transparent';
  const viewerButtonCircleClass =
    'relative z-10 flex justify-center items-center w-12 h-12 md:w-16 md:h-16 text-gray-200 bg-gray-500/30 active:bg-gray-500/90 backdrop-blur-sm rounded-full transition-all ease-out';
  const viewerButtonIconClass = 'w-8 h-8';

  onMount(() => {
    oldOverflowValue = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    oldActiveElement = document.activeElement;
    closeButtonRef?.focus();
  });

  onDestroy(() => {
    document.documentElement.style.overflow = oldOverflowValue ?? '';

    if (oldActiveElement && 'focus' in oldActiveElement && typeof oldActiveElement.focus === 'function') {
      oldActiveElement.focus();
    }
  });

  $effect(() => {
    if (imageRef) {
      setupPanzoom(imageRef);
    }
  });

  $effect(() => {
    if (image) {
      resetPanzoom();
    }
  });

  function handleCloseButtonClick(event: Event): void {
    event.stopPropagation();
    closeViewer();
  }

  function handleContainerPointerDown(): void {
    prevPanzoomPosition = panzoom?.getPan();
  }

  function handleContainerClick(): void {
    const { x: prevX, y: prevY } = prevPanzoomPosition ?? {};
    const { x: currX, y: currY } = panzoom?.getPan() ?? {};

    if (prevX === currX && prevY === currY) {
      toggleControls();
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
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
    onClose?.();
  }

  function toggleControls(): void {
    showControls = !showControls;
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

  async function setupPanzoom(imageRef: HTMLImageElement): Promise<void> {
    const isTouch = isTouchDevice();
    const isMacOs = isMacOsPlatform();
    panzoom = (await Panzoom.module)(imageRef, {
      minScale: 1,
      maxScale: 10,
      step: isMacOs ? 0.075 : isTouch ? 1 : 0.5,
      contain: 'outside',
      handleStartEvent: (event: Event) => {
        event.preventDefault();
      },
    });
    imageRef.addEventListener('wheel', panzoom.zoomWithWheel);
  }

  function resetPanzoom(): void {
    if (panzoom) {
      panzoom.reset({ animate: false });
    }
  }
</script>

<svelte:document onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class={containerClass} role="region" onclick={handleContainerClick} onpointerdown={handleContainerPointerDown}>
  <button
    class="viewer-button z-10 !top-2 right-2 {viewerButtonClass}"
    title="Bild schließen"
    bind:this={closeButtonRef}
    onclick={handleCloseButtonClick}
  >
    <span class={viewerButtonCircleClass}>
      <XIcon class={viewerButtonIconClass} />
    </span>
  </button>
  {#if isNavigationEnabled}
    {#if prevImage(image)}
      <button
        class="viewer-button z-10 left-2 {viewerButtonClass}"
        title="Vorheriges Bild anzeigen"
        onclick={handlePrevImageClick}
      >
        <span class={viewerButtonCircleClass}>
          <ChevronLeftIcon class={viewerButtonIconClass} />
        </span>
      </button>
    {/if}
    {#if nextImage(image)}
      <button
        class="viewer-button z-10 right-2 {viewerButtonClass}"
        title="Nächstes Bild anzeigen"
        onclick={handleNextImageClick}
      >
        <span class={viewerButtonCircleClass}>
          <ChevronRightIcon class={viewerButtonIconClass} />
        </span>
      </button>
    {/if}
  {/if}
  <div class={imageContainerClass}>
    <img class={imageClass} src={image.src} srcset={image.srcset} alt={image.alt} bind:this={imageRef} />
  </div>
</div>

<style lang="postcss">
  .viewer-button {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: calc(50% - 1.5rem);
    width: 3rem;
    height: 3rem;

    @screen md {
      top: calc(50% - 2rem);
      width: 4rem;
      height: 4rem;
    }

    @media (hover: hover) and (pointer: fine) {
      top: calc(50% - 3rem);
      width: 6rem;
      height: 6rem;

      & > span:hover {
        width: 100%;
        height: 100%;
        background-color: theme('colors.gray.500');
        opacity: 0.9;
      }
    }
  }
</style>
