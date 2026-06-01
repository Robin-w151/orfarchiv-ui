<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setReducedMotionStore } from '../src/lib/stores/runes/reducedMotion.svelte';
  import { setSkeletonStore } from '../src/lib/stores/runes/skeleton.svelte';
  import { setAudioStore } from '../src/lib/stores/runes/audio.svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  // Must run synchronously during component init (required when compilerOptions.experimental.async is true).
  setReducedMotionStore();
  setSkeletonStore();
  setAudioStore();
</script>

{@render children?.()}
