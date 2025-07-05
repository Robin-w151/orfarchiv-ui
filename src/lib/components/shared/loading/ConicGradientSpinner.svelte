<script lang="ts">
  import clsx from 'clsx';

  interface Props {
    class?: string;
  }

  let { class: clazz }: Props = $props();

  const spinnerClass = clsx([`flex justify-center items-center`, `w-6 h-6`, `rounded-full animate-spin`, clazz]);
</script>

<div class="spinner {spinnerClass}"></div>

<style>
  .spinner {
    background: conic-gradient(
      transparent 0deg,
      var(--color-fuchsia-600) 90deg,
      var(--color-violet-600) 180deg,
      var(--color-blue-700) 270deg,
      transparent 355deg
    );
  }

  :global(.dark) .spinner {
    background: conic-gradient(
      transparent 0deg,
      var(--color-fuchsia-400) 90deg,
      var(--color-violet-500) 180deg,
      var(--color-blue-500) 270deg,
      transparent 355deg
    );
  }
</style>
