<script lang="ts">
  import { getSourceLabel } from '$lib/models/settings';
  import { audioStore } from '$lib/stores/runes/audio.svelte';
  import { formatTimestamp } from '$lib/utils/datetime';
  import Button from '../controls/Button.svelte';
  import ArrowsPointingOutIcon from '../icons/outline/ArrowsPointingOutIcon.svelte';
  import ArrowUturnLeftIcon from '../icons/outline/ArrowUturnLeftIcon.svelte';
  import MinusIcon from '../icons/outline/MinusIcon.svelte';
  import PauseCircleIcon from '../icons/outline/PauseCircleIcon.svelte';
  import PauseIcon from '../icons/solid/PauseIcon.svelte';
  import PlayCircleIcon from '../icons/outline/PlayCircleIcon.svelte';
  import PlayIcon from '../icons/solid/PlayIcon.svelte';
  import XIcon from '../icons/outline/XIcon.svelte';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';

  const wrapperClass = ['fixed bottom-0 left-0 right-0 z-30 flex justify-end'];
  const playerClass = [
    'flex flex-col gap-4 mx-6 my-4 p-4',
    'w-full max-w-md',
    'bg-gray-100/90 dark:bg-gray-600/80',
    'rounded-xl shadow-md backdrop-blur-md',
  ];
  const minimizedPlayerClass = [
    'flex gap-2 m-1 p-3',
    'bg-gray-100/90 dark:bg-gray-600/80',
    'rounded-md shadow-md backdrop-blur-sm',
  ];
  const windowActionsClass = ['flex justify-end gap-2'];
  const titleClass = ['flex flex-col flex-1 items-start'];
  const metadataClass = ['flex flex-wrap items-center gap-x-1 text-sm text-gray-600 dark:text-gray-300'];
  const controlsClass = ['flex justify-center gap-2'];

  let minimized = $state(false);
  let sourceLabel = $derived(getSourceLabel(audioStore.story?.source));

  function handleToggleMinimized() {
    minimized = !minimized;
  }

  function handleClose() {
    audioStore.end();
    minimized = false;
  }
</script>

{#if audioStore.isActive}
  <AccessibleTransition class={wrapperClass}>
    {#if minimized}
      <div class={minimizedPlayerClass}>
        {#if audioStore.isPlaying}
          <Button class="w-fit" btnType="monochrome" iconOnly round title="Pausieren" onclick={audioStore.pause}>
            <PauseCircleIcon />
          </Button>
        {:else}
          <Button class="w-fit" btnType="monochrome" iconOnly round title="Vorlesen" onclick={audioStore.play}>
            <PlayCircleIcon />
          </Button>
        {/if}
        <Button btnType="monochrome" iconOnly round title="Maximieren" onclick={handleToggleMinimized}>
          <ArrowsPointingOutIcon />
        </Button>
        <Button btnType="monochrome" iconOnly round title="Schließen" onclick={handleClose}>
          <XIcon />
        </Button>
      </div>
    {:else}
      <section class={playerClass}>
        <div class={windowActionsClass}>
          <Button btnType="monochrome" iconOnly round title="Minimieren" onclick={handleToggleMinimized}>
            <MinusIcon />
          </Button>
          <Button btnType="monochrome" iconOnly round title="Schließen" onclick={handleClose}>
            <XIcon />
          </Button>
        </div>
        {#if audioStore.story}
          {@const story = audioStore.story}
          <div class={titleClass}>
            <h3>
              <span>{story.title}</span>
            </h3>
            <span class={metadataClass}>
              <span>{story.category ?? 'Keine Kategorie'}</span>
              {#if sourceLabel}
                <span>({sourceLabel})</span>
              {/if}
              <span>{formatTimestamp(story.timestamp)}</span></span
            >
          </div>
        {/if}
        <hr class="border-gray-400" />
        <div class={controlsClass}>
          <Button
            class="w-fit"
            btnType="monochrome"
            size="large"
            iconOnly
            round
            title={audioStore.isPlaying ? 'Pausieren' : 'Vorlesen'}
            onclick={audioStore.isPlaying ? audioStore.pause : audioStore.play}
          >
            {#if audioStore.isPlaying}
              <PauseIcon class="w-8 h-8" />
            {:else}
              <PlayIcon class="w-8 h-8" />
            {/if}
          </Button>
          <Button
            btnType="monochrome"
            size="large"
            iconOnly
            round
            title="Vom Anfang"
            onclick={audioStore.playFromStart}
          >
            <ArrowUturnLeftIcon class="w-8 h-8" />
          </Button>
        </div>
      </section>
    {/if}
  </AccessibleTransition>
{/if}
