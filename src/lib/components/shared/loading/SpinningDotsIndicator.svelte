<script lang="ts">
  import settings from '$lib/stores/settings';
  import { transitionDefaults } from '$lib/utils/transitions';
  import clsx from 'clsx';
  import { onDestroy, onMount } from 'svelte';
  import type { KeyboardEventHandler, MouseEventHandler } from 'svelte/elements';
  import { fade } from 'svelte/transition';

  interface Props {
    delay?: number;
    onclick?: MouseEventHandler<HTMLDivElement>;
    onkeydown?: KeyboardEventHandler<HTMLDivElement>;
  }

  let { delay = 0, onclick, onkeydown }: Props = $props();

  let showIndicator = $state(!delay);
  let timeout: any;
  let backdropRef = $state<HTMLDivElement | undefined>(undefined);

  const dotClass = clsx(['absolute', 'w-4 h-4', 'rounded-full']);

  $effect(() => {
    if (showIndicator) {
      backdropRef?.focus();
    }
  });

  onMount(() => {
    if (!showIndicator) {
      timeout = setTimeout(() => {
        showIndicator = true;
      }, delay);
    }
  });

  onDestroy(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });

  function handleBackdropClick(event: MouseEvent & { currentTarget: HTMLDivElement }): void {
    if (showIndicator) {
      onclick?.(event);
    }
  }

  function handleBackdropKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }): void {
    if (showIndicator) {
      onkeydown?.(event);
    }
  }
</script>

{#if showIndicator && !$settings.forceReducedMotion}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="backdrop flex justify-center items-center fixed top-0 left-0 right-0 bottom-0 z-50 bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-xs"
    role="alert"
    tabindex="0"
    bind:this={backdropRef}
    onclick={handleBackdropClick}
    onkeydown={handleBackdropKeydown}
    transition:fade|global={transitionDefaults}
  >
    <div class="loading-indicator relative w-48 h-48">
      <div class="dot-1 {dotClass} bg-fuchsia-500 shadow-[0px_0px_16px_2px_rgba(217,_70,_239,_1)]"></div>
      <div class="dot-2 {dotClass} bg-fuchsia-700 shadow-[0px_0px_16px_2px_rgba(162,_28,_175,_1)]"></div>
      <div class="dot-3 {dotClass} bg-violet-700 shadow-[0px_0px_16px_2px_rgba(109,_40,_217,_1)]"></div>
      <div class="dot-4 {dotClass} bg-blue-700 shadow-[0px_0px_16px_2px_rgba(29,_78,_216,_1)]"></div>
      <div class="dot-5 {dotClass} bg-blue-500 shadow-[0px_0px_16px_2px_rgba(59,_130,_246,_1)]"></div>
      <div class="dot-6 {dotClass} bg-cyan-500 shadow-[0px_0px_16px_2px_rgba(6,_182,_212,_1)]"></div>
      <div class="dot-7 {dotClass} bg-cyan-300 shadow-[0px_0px_16px_2px_rgba(103,_232,_249,_1)]"></div>
    </div>
  </div>
{/if}

<style>
  .loading-indicator {
    animation: dot-spin 2s linear infinite;
  }

  .dot-1 {
    top: calc(0rem - 0.5rem);
    left: calc(6rem - 0.5rem);
    animation: dot-scale 1.6s linear infinite;
  }

  .dot-2 {
    top: calc(6rem - (sin(135deg) * 6rem) - 0.5rem);
    left: calc(6rem + (cos(135deg) * 6rem) - 0.5rem);
    animation: dot-scale 1.6s 0.2s linear infinite;
  }

  .dot-3 {
    top: calc(6rem - 0.5rem);
    left: calc(0rem - 0.5rem);
    animation: dot-scale 1.6s 0.4s linear infinite;
  }

  .dot-4 {
    top: calc(6rem - (sin(225deg) * 6rem) - 0.5rem);
    left: calc(6rem + (cos(225deg) * 6rem) - 0.5rem);
    animation: dot-scale 1.6s 0.6s linear infinite;
  }

  .dot-5 {
    top: calc(12rem - 0.5rem);
    left: calc(6rem - 0.5rem);
    animation: dot-scale 1.6s 0.8s linear infinite;
  }

  .dot-6 {
    top: calc(6rem - (sin(315deg) * 6rem) - 0.5rem);
    left: calc(6rem + (cos(315deg) * 6rem) - 0.5rem);
    animation: dot-scale 1.6s 1s linear infinite;
  }

  .dot-7 {
    top: calc(6rem - 0.5rem);
    left: calc(12rem - 0.5rem);
    animation: dot-scale 1.6s 1.2s linear infinite;
  }

  @keyframes dot-scale {
    0% {
      transform: scale(1);
    }
    25% {
      transform: scale(2.25);
    }
    50%,
    100% {
      transform: scale(1);
    }
  }

  @keyframes dot-spin {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(90deg);
    }
    50% {
      transform: rotate(180deg);
    }
    75% {
      transform: rotate(270deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
