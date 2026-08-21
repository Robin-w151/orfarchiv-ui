<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { getAudioStore } from '$lib/stores/runes/audio.svelte';
  import { ArrowUturnLeft, Backward, Forward, Pause, Play } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  const audioStore = getAudioStore();

  const controlsClass = ['flex justify-center gap-2'];
</script>

<div class={controlsClass}>
  {#if audioStore.hasChapters}
    <Button
      btnType="monochrome"
      size="large"
      iconOnly
      round
      title="Vorheriges Kapitel"
      onclick={audioStore.previousChapter}
    >
      <Icon src={Backward} theme="solid" class="size-8" />
    </Button>
  {/if}
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
  {#if audioStore.hasChapters}
    <Button
      btnType="monochrome"
      size="large"
      iconOnly
      round
      disabled={audioStore.chapterIndex >= audioStore.chapters.length - 1}
      title="Nächstes Kapitel"
      onclick={audioStore.nextChapter}
    >
      <Icon src={Forward} theme="solid" class="size-8" />
    </Button>
  {/if}
  <Button btnType="monochrome" size="large" iconOnly round title="Vom Anfang" onclick={audioStore.playFromStart}>
    <Icon src={ArrowUturnLeft} theme="solid" class="size-8" />
  </Button>
</div>
