<script lang="ts">
  import XIcon from '$lib/components/ui/icons/outline/XIcon.svelte';
  import Button from './Button.svelte';

  interface Props {
    id: string;
    value?: string;
    placeholder?: string;
    onchange?: (value?: string) => void;
    onclear?: () => void;
  }

  let { id, value = $bindable(''), placeholder, onchange, onclear }: Props = $props();

  const wrapperClass = `flex items-center relative w-full flex-1`;
  const inputClass = `
    pr-12 w-full
    text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900
    focus:ring-0
    focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500
    rounded-md
    transition
  `;
  const clearButtonClass = `
    absolute right-2
  `;

  let inputRef: HTMLInputElement | undefined = $state();
  let showClearButton = $derived(!!value);

  $effect(() => {
    onchange?.(value);
  });

  export function focus() {
    inputRef?.focus();
  }

  function handleClearButtonClick() {
    value = '';
    onclear?.();
    inputRef?.focus();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      inputRef?.blur();
    }
  }
</script>

<div class={wrapperClass}>
  <input
    class={inputClass}
    type="text"
    {id}
    onkeydown={handleKeydown}
    bind:value
    bind:this={inputRef}
    {placeholder}
    maxlength="256"
  />
  {#if showClearButton}
    <Button
      class={clearButtonClass}
      btnType="monochrome"
      size="small"
      iconOnly
      round
      title="Eingabe löschen"
      onclick={handleClearButtonClick}
      onkeydown={handleKeydown}
    >
      <XIcon />
    </Button>
  {/if}
</div>
