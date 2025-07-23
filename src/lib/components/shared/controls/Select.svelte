<script lang="ts">
  import { ChevronDown } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    value?: string;
    placeholder?: string;
    onchange?: (value?: string) => void;
    children?: Snippet;
  }

  let { id, value = $bindable(''), placeholder, onchange, children }: Props = $props();

  const selectContainerClass = ['flex items-center relative w-full flex-1'];
  const selectClass = [
    'pr-12 w-full',
    'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900',
    'rounded-md',
    'transition',
    'bg-none',
  ];
  const selectIconClass = ['absolute right-3', 'size-6', 'text-gray-700 dark:text-gray-300', 'pointer-events-none'];

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

<div class={selectContainerClass}>
  <select class={selectClass} {id} {placeholder} bind:value bind:this={selectRef} onkeydown={handleKeydown}>
    {@render children?.()}
  </select>
  <Icon class={selectIconClass} src={ChevronDown} />
</div>
