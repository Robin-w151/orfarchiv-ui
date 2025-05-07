<script lang="ts">
  import { getSourceLabel } from '$lib/models/settings';
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { formatTimestamp } from '$lib/utils/datetime';
  import {
    ArrowsPointingOut,
    ArrowUturnLeft,
    Minus,
    Pause,
    PauseCircle,
    Play,
    PlayCircle,
    XMark,
  } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import Button from '../controls/Button.svelte';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';

  const audioStore = getAudioStore();

  let minimized = $state(false);
  let sourceLabel = $derived(getSourceLabel(audioStore.story?.source));

  const wrapperClass = $derived(['fixed bottom-0 right-0 z-30 flex justify-end', !minimized && 'w-full sm:w-[32rem]']);
  const playerClass = [
    'flex flex-col gap-4 mx-6 my-4 p-4',
    'w-full',
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

  function handleToggleMinimized(): void {
    minimized = !minimized;
  }

  function handleClose(): void {
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
            <Icon src={PauseCircle} theme="outlined" class="size-6" />
          </Button>
        {:else}
          <Button class="w-fit" btnType="monochrome" iconOnly round title="Vorlesen" onclick={audioStore.play}>
            <Icon src={PlayCircle} theme="outlined" class="size-6" />
          </Button>
        {/if}
        <Button btnType="monochrome" iconOnly round title="Maximieren" onclick={handleToggleMinimized}>
          <Icon src={ArrowsPointingOut} theme="outlined" class="size-6" />
        </Button>
        <Button btnType="monochrome" iconOnly round title="Schließen" onclick={handleClose}>
          <Icon src={XMark} theme="outlined" class="size-6" />
        </Button>
      </div>
    {:else}
      <section class={playerClass}>
        <div class={windowActionsClass}>
          <Button btnType="monochrome" iconOnly round title="Minimieren" onclick={handleToggleMinimized}>
            <Icon src={Minus} theme="outlined" class="size-6" />
          </Button>
          <Button btnType="monochrome" iconOnly round title="Schließen" onclick={handleClose}>
            <Icon src={XMark} theme="outlined" class="size-6" />
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
              <Icon src={Pause} theme="solid" class="size-8" />
            {:else}
              <Icon src={Play} theme="solid" class="size-8" />
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
            <Icon src={ArrowUturnLeft} theme="solid" class="size-8" />
          </Button>
        </div>
      </section>
    {/if}
  </AccessibleTransition>
{/if}
