<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { ArrowsPointingOut, PauseCircle, PlayCircle, XMark } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    onMaximize: () => void;
    onClose: () => void;
  }

  const { onMaximize, onClose }: Props = $props();

  const audioStore = getAudioStore();

  const minimizedPlayerClass = [
    'flex gap-2 m-1 p-3',
    'bg-gray-100/90 dark:bg-gray-600/80',
    'rounded-md shadow-md backdrop-blur-xs',
  ];
</script>

<div class={minimizedPlayerClass} style="view-transition-name: audio-player">
  {#if audioStore.isPlaying}
    <Button class="w-fit" btnType="monochrome" iconOnly round title="Pausieren" onclick={audioStore.pause}>
      <Icon src={PauseCircle} theme="outlined" class="size-6" />
    </Button>
  {:else}
    <Button class="w-fit" btnType="monochrome" iconOnly round title="Vorlesen" onclick={audioStore.play}>
      <Icon src={PlayCircle} theme="outlined" class="size-6" />
    </Button>
  {/if}
  <Button btnType="monochrome" iconOnly round title="Maximieren" onclick={onMaximize}>
    <Icon src={ArrowsPointingOut} theme="outlined" class="size-6" />
  </Button>
  <Button btnType="monochrome" iconOnly round title="Schließen" onclick={onClose}>
    <Icon src={XMark} theme="outlined" class="size-6" />
  </Button>
</div>
