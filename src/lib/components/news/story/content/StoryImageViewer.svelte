<script lang="ts">
  import Popover from '$lib/components/shared/content/Popover.svelte';
  import PopoverContent from '$lib/components/shared/content/PopoverContent.svelte';
  import { PAN_DISTANCE } from '$lib/configs/client';
  import type { StoryImage } from '$lib/models/story';
  import { logger } from '$lib/utils/logger';
  import { Panzoom } from '$lib/utils/panzoomModule';
  import { defaultBackground, defaultGap, defaultPadding, defaultText } from '$lib/utils/styles';
  import { isMacOsPlatform, isTouchDevice } from '$lib/utils/support';
  import type { PanzoomObject } from '@panzoom/panzoom';
  import { ChevronLeft, ChevronRight, QuestionMarkCircle, XMark } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { onDestroy, onMount } from 'svelte';

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
  let prevPanzoomZoom: number | undefined;

  let isNavigationEnabled = $derived(images.length > 1);
  let viewerButtonClass = $derived(`${showControls ? 'visible' : 'invisible'}`);

  const shortcuts: Array<{ key: string; description: string }> = [
    { key: 'ESC', description: 'Bildansicht beenden' },
    { key: '←', description: 'Vorheriges Bild anzeigen' },
    { key: '→', description: 'Nächstes Bild anzeigen' },
    { key: 'CTRL +', description: 'Heranzoomen' },
    { key: 'CTRL -', description: 'Herauszoomen' },
    { key: 'CTRL 0', description: 'Zoom zurücksetzen' },
    { key: 'CTRL ←', description: 'Nach links bewegen' },
    { key: 'CTRL →', description: 'Nach rechts bewegen' },
    { key: 'CTRL ↑', description: 'Nach oben bewegen' },
    { key: 'CTRL ↓', description: 'Nach unten bewegen' },
  ];

  const containerClass = 'flex justify-center items-center fixed top-0 bottom-0 left-0 right-0 z-50';
  const imageContainerClass = 'w-full h-full bg-black';
  const imageClass = 'object-scale-down w-full h-full bg-transparent';
  const viewerButtonCircleClass =
    'relative z-10 flex justify-center items-center w-12 h-12 md:w-16 md:h-16 text-gray-200 bg-gray-500/30 active:bg-gray-500/90 backdrop-blur-sm rounded-full transition-all ease-out';
  const viewerButtonIconClass = 'size-8';

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
      resetPanzoom(false);
    }
  });

  function handleCloseButtonClick(event: Event): void {
    event.stopPropagation();
    closeViewer();
  }

  function handleContainerPointerDown(): void {
    prevPanzoomPosition = panzoom?.getPan();
    prevPanzoomZoom = panzoom?.getScale();
  }

  function handleContainerClick(): void {
    const { x: prevX, y: prevY } = prevPanzoomPosition ?? {};
    const { x: currX, y: currY } = panzoom?.getPan() ?? {};
    const currZoom = panzoom?.getScale();

    if (deltaCompare(prevX, currX) && deltaCompare(prevY, currY) && deltaCompare(prevPanzoomZoom, currZoom)) {
      toggleControls();
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const { key, ctrlKey } = event;

    if (ctrlKey) {
      switch (key) {
        case '+':
          event.preventDefault();
          panzoom?.zoomIn();
          return;
        case '-':
          event.preventDefault();
          panzoom?.zoomOut();
          return;
        case '0':
          event.preventDefault();
          resetPanzoom();
          return;
        case 'ArrowUp':
          event.preventDefault();
          panzoom?.pan(0, PAN_DISTANCE, { relative: true });
          return;
        case 'ArrowDown':
          event.preventDefault();
          panzoom?.pan(0, -PAN_DISTANCE, { relative: true });
          return;
        case 'ArrowLeft':
          event.preventDefault();
          panzoom?.pan(PAN_DISTANCE, 0, { relative: true });
          return;
        case 'ArrowRight':
          event.preventDefault();
          panzoom?.pan(-PAN_DISTANCE, 0, { relative: true });
          return;
      }
    } else {
      switch (key) {
        case 'ArrowLeft':
          gotoPrevImage();
          return;
        case 'ArrowRight':
          gotoNextImage();
          return;
        case 'Escape':
          event.preventDefault();
          closeViewer();
          return;
      }
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

  function handleHelpClick(event: Event): void {
    event.stopPropagation();
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

    try {
      panzoom = (await Panzoom.module)(imageRef, {
        minScale: 1,
        maxScale: 10,
        step: isTouch ? 1 : isMacOs ? 0.075 : 0.5,
        contain: 'outside',
        animate: true,
        handleStartEvent: (event: Event) => {
          event.preventDefault();
        },
      });
      imageRef.addEventListener('wheel', panzoom.zoomWithWheel);
    } catch (error) {
      logger.error('Failed to setup panzoom!', error);
    }
  }

  function resetPanzoom(animate = true): void {
    if (panzoom) {
      panzoom.reset({ animate });
    }
  }

  function deltaCompare(a: number | undefined, b: number | undefined, delta = 0.01): boolean {
    if (a === undefined || b === undefined) {
      return false;
    }

    return Math.abs(a - b) < delta;
  }
</script>

<svelte:document onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class={containerClass} role="region" onclick={handleContainerClick} onpointerdown={handleContainerPointerDown}>
  <button
    class="viewer-button z-10 top-2 right-2 {viewerButtonClass}"
    title="Bild schließen"
    bind:this={closeButtonRef}
    onclick={handleCloseButtonClick}
  >
    <span class={viewerButtonCircleClass}>
      <Icon src={XMark} theme="outlined" class={viewerButtonIconClass} />
    </span>
  </button>
  {#if isNavigationEnabled}
    {#if prevImage(image)}
      <button
        class="viewer-button viewer-button-center z-10 left-2 {viewerButtonClass}"
        title="Vorheriges Bild anzeigen"
        onclick={handlePrevImageClick}
      >
        <span class={viewerButtonCircleClass}>
          <Icon src={ChevronLeft} theme="outlined" class={viewerButtonIconClass} />
        </span>
      </button>
    {/if}
    {#if nextImage(image)}
      <button
        class="viewer-button viewer-button-center z-10 right-2 {viewerButtonClass}"
        title="Nächstes Bild anzeigen"
        onclick={handleNextImageClick}
      >
        <span class={viewerButtonCircleClass}>
          <Icon src={ChevronRight} theme="outlined" class={viewerButtonIconClass} />
        </span>
      </button>
    {/if}
  {/if}
  <Popover
    containerClass="viewer-button bottom-2 right-2 {viewerButtonClass}"
    placement="top-end"
    openOnHover
    delay={{ open: 250 }}
  >
    {#snippet anchorContent(props)}
      <span class={viewerButtonCircleClass} {...props} onclick={handleHelpClick}>
        <Icon src={QuestionMarkCircle} theme="outlined" class={viewerButtonIconClass} />
      </span>
    {/snippet}
    {#snippet popoverContent()}
      <PopoverContent>
        <div class="flex flex-col {defaultGap} {defaultPadding} w-max {defaultText} {defaultBackground} rounded-lg">
          <table>
            <thead>
              <tr>
                <th class="p-2">Kombination</th>
                <th class="p-2">Beschreibung</th>
              </tr>
            </thead>
            <tbody>
              {#each shortcuts as { key, description }}
                <tr>
                  <td class="px-2 py-1 whitespace-nowrap">{key}</td>
                  <td class="px-2 py-1 whitespace-nowrap">{description}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </PopoverContent>
    {/snippet}
  </Popover>
  <div class={imageContainerClass}>
    <img class={imageClass} src={image.src} srcset={image.srcset} alt={image.alt} bind:this={imageRef} />
  </div>
</div>

<style lang="postcss">
  :global(.viewer-button) {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    width: 3rem;
    height: 3rem;

    @screen md {
      width: 4rem;
      height: 4rem;
    }

    @media (hover: hover) and (pointer: fine) {
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

  .viewer-button-center {
    top: calc(50% - 1.5rem);

    @screen md {
      top: calc(50% - 2rem);
    }

    @media (hover: hover) and (pointer: fine) {
      top: calc(50% - 3rem);
    }
  }
</style>
