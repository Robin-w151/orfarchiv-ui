<script lang="ts">
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { getReducedMotionStore } from '$lib/stores/runes/reducedMotion.svelte';
  import { runViewTransition } from '$lib/utils/viewTransition';
  import AccessibleTransition from '../../transitions/AccessibleTransition.svelte';
  import Chapters from './chapters/Chapters.svelte';
  import Controls from './controls/Controls.svelte';
  import WindowControls from './controls/WindowControls.svelte';
  import Info from './info/Info.svelte';
  import MiniPlayer from './mini/MiniPlayer.svelte';

  const audioStore = getAudioStore();
  const reducedMotionStore = getReducedMotionStore();

  let minimized = $state(false);

  const wrapperClass = $derived([
    'fixed bottom-0 right-0 z-30 flex justify-end',
    !minimized && 'w-full max-w-full sm:w-[32rem] overflow-hidden',
  ]);
  const playerClass = [
    'flex flex-col gap-4 mx-4 sm:mx-6 my-2 sm:my-4 p-4',
    'w-full max-w-full overflow-hidden overscroll-contain',
    'bg-gray-100/90 dark:bg-gray-600/80',
    'rounded-xl shadow-md backdrop-blur-md',
  ];

  function handleToggleMinimized(): void {
    runViewTransition(
      () => {
        minimized = !minimized;
      },
      { useReducedMotion: reducedMotionStore.useReducedMotion },
    );
  }

  function handleClose(): void {
    audioStore.end();
    audioStore.chaptersExpanded = false;
    minimized = false;
  }
</script>

{#if audioStore.isActive}
  <AccessibleTransition class={wrapperClass}>
    {#if minimized}
      <MiniPlayer onMaximize={handleToggleMinimized} onClose={handleClose} />
    {:else}
      <section class={playerClass} style="view-transition-name: audio-player">
        <WindowControls onMinimize={handleToggleMinimized} onClose={handleClose} />
        <Info />
        <Chapters />
        <hr class="border-gray-400" />
        <Controls />
      </section>
    {/if}
  </AccessibleTransition>
{/if}

<style>
  :global(::view-transition-old(audio-player)),
  :global(::view-transition-new(audio-player)) {
    animation-duration: var(--oa-view-transition-duration);
    animation-timing-function: ease-out;
  }

  :global(::view-transition-old(audio-player)) {
    animation-name: oa-scale-out;
    transform-origin: bottom right;
  }

  :global(::view-transition-new(audio-player)) {
    animation-name: oa-scale-in;
    transform-origin: bottom right;
  }
</style>
