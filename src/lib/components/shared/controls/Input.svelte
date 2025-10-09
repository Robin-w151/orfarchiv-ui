<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import Button from './Button.svelte';
  import { XMark } from '@steeze-ui/heroicons';
  import KeyboardKey from '../content/KeyboardKey.svelte';

  interface Props {
    id: string;
    value?: string;
    placeholder?: string;
    shortcutKeys?: Array<string>;
    onValueChange?: (value?: string) => void;
    onchange?: (value: string | undefined, event: Event) => void;
    onclear?: () => void;
    onfocus?: (event: Event) => void;
    onblur?: (event: Event) => void;
    onkeydown?: (event: KeyboardEvent) => void;
  }

  let {
    id,
    value = $bindable(''),
    placeholder,
    shortcutKeys,
    onValueChange,
    onchange,
    onclear,
    onfocus,
    onblur,
    onkeydown,
  }: Props = $props();

  const wrapperClass = 'flex items-center relative w-full flex-1';
  const inputClass = [
    'pr-12 w-full',
    'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900',
    'rounded-md',
    'transition',
  ];
  const clearButtonClass = 'absolute right-2';
  const shortcutKeysClass = 'absolute right-2 flex gap-1';

  let inputRef: HTMLInputElement | undefined = $state();
  let showClearButton = $derived(!!value);
  let isFocused = $state(false);

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

  function handleFocus(event: Event): void {
    isFocused = true;
    onfocus?.(event);
  }

  function handleBlur(event: Event): void {
    isFocused = false;
    onblur?.(event);
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
    onfocus={handleFocus}
    onblur={handleBlur}
  />
  {#if shortcutKeys && shortcutKeys.length > 0 && !value && !isFocused}
    <div class={shortcutKeysClass}>
      {#each shortcutKeys as key (key)}
        <KeyboardKey {key} />
      {/each}
    </div>
  {/if}
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
