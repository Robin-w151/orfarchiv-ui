<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import Button from './Button.svelte';
  import { XMark } from '@steeze-ui/heroicons';

  interface Props {
    id: string;
    value?: string;
    placeholder?: string;
    onValueChange?: (value?: string) => void;
    onchange?: (value: string | undefined, event: Event) => void;
    onclear?: () => void;
    onblur?: (event: Event) => void;
    onkeydown?: (event: KeyboardEvent) => void;
  }

  let { id, value = $bindable(''), placeholder, onValueChange, onchange, onclear, onblur, onkeydown }: Props = $props();

  const wrapperClass = 'flex items-center relative w-full flex-1';
  const inputClass = [
    'pr-12 w-full',
    'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900',
    'focus:outline-hidden focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500',
    'rounded-md',
    'transition',
  ];
  const clearButtonClass = 'absolute right-2';

  let inputRef: HTMLInputElement | undefined = $state();
  let showClearButton = $derived(!!value);

  $effect(() => {
    onValueChange?.(value);
  });

  export function focus(): void {
    inputRef?.focus();
  }

  function handleClearButtonClick(): void {
    value = '';
    onclear?.();
    inputRef?.focus();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      inputRef?.blur();
    }

    onkeydown?.(event);
  }
</script>

<div class={wrapperClass}>
  <input
    class={inputClass}
    type="text"
    {id}
    bind:value
    bind:this={inputRef}
    {placeholder}
    maxlength="256"
    onkeydown={handleKeydown}
    onchange={(event) => onchange?.(value, event)}
    {onblur}
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
      <Icon src={XMark} theme="outlined" class="size-6" />
    </Button>
  {/if}
</div>
