<script lang="ts">
  import Popover from '$lib/components/shared/content/Popover.svelte';
  import PopoverContent from '$lib/components/shared/content/PopoverContent.svelte';
  import { PAN_DISTANCE } from '$lib/configs/client';
  import type { StoryImage } from '$lib/models/story';
  import { getReducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import { focusTrap } from '$lib/utils/focusTrap';
  import { logger } from '$lib/utils/logger';
  import { Panzoom } from '$lib/utils/panzoomModule';
  import { defaultBackground, defaultGap, defaultPadding, defaultText } from '$lib/utils/styles';
  import { isTouchDevice } from '$lib/utils/support';
  import { runViewTransition } from '$lib/utils/viewTransition';
  import type { PanzoomObject } from '@panzoom/panzoom';
  import { ChevronLeft, ChevronRight, QuestionMarkCircle, XMark } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { onDestroy, onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';

  interface Props {
    image: StoryImage;
    images?: Array<StoryImage>;
    onClose?: () => void;
  }

  type ImageLookup<TCount extends number | undefined = undefined> = TCount extends 1
    ? StoryImage | undefined
    : TCount extends undefined
      ? StoryImage | undefined
      : Array<StoryImage>;

  let { image = $bindable(), images = [], onClose }: Props = $props();

  const reducedMotionStore = getReducedMotionStore();

  let showControls = $state(true);
  let closeButtonRef: HTMLButtonElement | undefined = $state();
  let oldOverflowValue: string | undefined;
  let oldActiveElement: Element | null;
  let imageRef = $state<HTMLImageElement | undefined>();
  let panzoom: PanzoomObject | undefined;
  let prevPanzoomPosition: { x: number; y: number } | undefined;
  let prevPanzoomZoom: number | undefined;

  let isNavigationEnabled = $derived(images.length > 1);
  let visibilityClass = $derived(`${showControls ? 'visible' : 'invisible'}`);

  const preloadedImages = new SvelteMap<string, boolean>();
  const shortcuts: Array<{ keys: Array<string>; description: string }> = [
    { keys: ['Esc'], description: 'Bildansicht beenden' },
    { keys: ['←'], description: 'Vorheriges Bild anzeigen' },
    { keys: ['→'], description: 'Nächstes Bild anzeigen' },
    { keys: ['Ctrl', '+'], description: 'Heranzoomen' },
    { keys: ['Ctrl', '-'], description: 'Herauszoomen' },
    { keys: ['Ctrl', '0'], description: 'Zoom zurücksetzen' },
    { keys: ['Ctrl', '←'], description: 'Nach links bewegen' },
    { keys: ['Ctrl', '→'], description: 'Nach rechts bewegen' },
    { keys: ['Ctrl', '↑'], description: 'Nach oben bewegen' },
    { keys: ['Ctrl', '↓'], description: 'Nach unten bewegen' },
  ];

  const containerClass = 'flex justify-center items-center fixed top-0 bottom-0 left-0 right-0 z-50';
  const imageContainerClass = 'w-full h-full bg-black';
  const imageClass = 'object-scale-down w-full h-full bg-transparent';
  const viewerButtonCircleClass =
    'relative z-20 flex justify-center items-center w-12 h-12 md:w-16 md:h-16 text-gray-200 bg-gray-500/30 active:bg-gray-500/90 backdrop-blur-xs rounded-full transition-all ease-out';
  const viewerButtonIconClass = 'size-8';
  const infoContainerClass = [
    `flex flex-col ${defaultGap}`,
    `${defaultPadding} w-max max-h-[70dvh]`,
    `${defaultText} ${defaultBackground}`,
    'rounded-lg overflow-auto',
  ];
  const infoTableHeaderClass = 'p-2';
  const infoTableCellClass = 'px-2 py-1 whitespace-nowrap';
  const infoTableKeysClass = 'flex items-center gap-1';
  const infoTableKeyClass =
    'flex justify-center items-center px-1 py-0.5 min-w-5 text-xs border-1 border-gray-400 dark:border-gray-500 rounded-sm shadow-sm';
  const infoTableKeySeparatorClass = 'px-1';
  const captionClass =
    'absolute bottom-0 left-0 right-0 z-10 p-6 pt-16 pr-32 text-white text-sm md:text-base bg-gradient-to-t from-black to-transparent transition-all ease-out';

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
      imageRef.style.viewTransitionClass = 'story-image';
      setupPanzoom(imageRef);
    }
  });

  $effect(() => {
    if (image) {
      resetPanzoom(false);
      preloadImages(image);
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

  function handleInfoTableClick(event: Event): void {
    event.stopPropagation();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const { key, ctrlKey, metaKey } = event;

    if (ctrlKey || metaKey) {
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
    runViewTransition(
      () => {
        onClose?.();
      },
      {
        useReducedMotion: reducedMotionStore.useReducedMotion,
      },
    );
  }

  function toggleControls(): void {
    showControls = !showControls;
  }

  function nextImage<TCount extends number | undefined = undefined>(
    image: StoryImage,
    count?: TCount,
  ): ImageLookup<TCount> {
    const index = images.findIndex(({ src }) => src === image.src);
    if (count === undefined || count === 1) {
      return images[index + 1] as any;
    } else {
      return images.slice(index + 1, Math.min(index + count + 1, images.length)) as any;
    }
  }

  function prevImage<TCount extends number | undefined = undefined>(
    image: StoryImage,
    count?: TCount,
  ): ImageLookup<TCount> {
    const index = images.findIndex(({ src }) => src === image.src);
    if (count === undefined || count === 1) {
      return images[index - 1] as any;
    } else {
      return images.slice(Math.max(index - count, 0), index) as any;
    }
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

    try {
      panzoom = (await Panzoom.module)(imageRef, {
        minScale: 1,
        maxScale: 10,
        step: isTouch ? 1 : 0.5,
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

  function preloadImages(image: StoryImage): void {
    preloadedImages.set(image.src, true);
    const contiguousImages = [...nextImage(image, 3), ...prevImage(image, 3)];
    contiguousImages.forEach((image) => {
      if (image && !preloadedImages.has(image.src)) {
        preloadImage(image).then(() => {
          preloadedImages.set(image.src, true);
        });
      }
    });
  }

  function preloadImage(image: StoryImage): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = image.src;
      img.onload = () => {
        resolve();
      };
      img.onerror = () => {
        resolve();
      };
    });
  }
</script>

<svelte:document onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class={containerClass}
  role="region"
  aria-label="Bildanzeige"
  onclick={handleContainerClick}
  onpointerdown={handleContainerPointerDown}
  {@attach focusTrap({ skipInitialFocus: true })}
>
  <button
    class="viewer-button z-10 top-2 right-2 {visibilityClass}"
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
        class="viewer-button viewer-button-center z-20 left-2 {visibilityClass}"
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
        class="viewer-button viewer-button-center z-20 right-2 {visibilityClass}"
        title="Nächstes Bild anzeigen"
        onclick={handleNextImageClick}
      >
        <span class={viewerButtonCircleClass}>
          <Icon src={ChevronRight} theme="outlined" class={viewerButtonIconClass} />
        </span>
      </button>
    {/if}
  {/if}
  {#if image.caption}
    <div class="{captionClass} {visibilityClass}">
      <span>{image.caption}</span>
    </div>
  {/if}
  <Popover
    containerClass="viewer-button viewer-button-touch bottom-2 right-2 {visibilityClass}"
    placement="top-end"
    openOnHover
    delay={250}
  >
    {#snippet anchorContent(props)}
      <span class={viewerButtonCircleClass} {...props} onclick={handleHelpClick}>
        <Icon src={QuestionMarkCircle} theme="outlined" class={viewerButtonIconClass} />
      </span>
    {/snippet}
    {#snippet popoverContent({ transformOrigin })}
      <PopoverContent {transformOrigin}>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class={infoContainerClass} onclick={handleInfoTableClick}>
          <table>
            <thead>
              <tr>
                <th class={infoTableHeaderClass}>Kombination</th>
                <th class={infoTableHeaderClass}>Beschreibung</th>
              </tr>
            </thead>
            <tbody>
              {#each shortcuts as { keys, description } (description)}
                <tr>
                  <td class={infoTableCellClass}>
                    <span class={infoTableKeysClass}>
                      {#each keys as key, index (key)}
                        <kbd class={infoTableKeyClass}>{key}</kbd>
                        {#if index !== keys.length - 1}
                          <span class={infoTableKeySeparatorClass}>+</span>
                        {/if}
                      {/each}
                    </span>
                  </td>
                  <td class={infoTableCellClass}>{description}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </PopoverContent>
    {/snippet}
  </Popover>
  <div class={imageContainerClass}>
    <img class={imageClass} src={image.src} alt={image.alt} bind:this={imageRef} />
  </div>
</div>

<style>
  @reference 'tailwindcss';

  :global(.viewer-button) {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    width: 3rem;
    height: 3rem;
    border-radius: 9999px;

    @media screen and (width >= theme(--breakpoint-md)) {
      width: 4rem;
      height: 4rem;
    }

    @media (hover: hover) and (pointer: fine) {
      width: 6rem;
      height: 6rem;

      & > span:hover {
        width: 100%;
        height: 100%;
        background-color: var(--color-gray-500);
        opacity: 0.9;
      }
    }
  }

  :global(.viewer-button-touch) {
    @media screen and (pointer: coarse) {
      display: none;
    }
  }

  .viewer-button-center {
    top: calc(50% - 1.5rem);

    @media screen and (width >= theme(--breakpoint-md)) {
      top: calc(50% - 2rem);
    }

    @media (hover: hover) and (pointer: fine) {
      top: calc(50% - 3rem);
    }
  }
</style>
