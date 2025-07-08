<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    value?: string;
    placeholder?: string;
    onchange?: (value?: string) => void;
    children?: Snippet;
  }

  let { id, value = $bindable(''), placeholder, onchange, children }: Props = $props();

  const selectClass = [
    'pr-12 w-full',
    'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900',
    'rounded-md',
    'transition',
  ];

  let selectRef: HTMLSelectElement | undefined = $state();

  $effect(() => {
    onchange?.(value);
  });

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      selectRef?.blur();
    }
  }
</script>

<select class={selectClass} {id} {placeholder} bind:value bind:this={selectRef} onkeydown={handleKeydown}>
  {@render children?.()}
</select>
