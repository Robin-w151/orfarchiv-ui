<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import Button from './Button.svelte';
  import { XMark } from '@steeze-ui/heroicons';
  import KeyboardKey from '../content/KeyboardKey.svelte';

  interface Props {
    id: string;
    value?: string;
    tag?: string;
    placeholder?: string;
    shortcutKeys?: Array<string>;
    onValueChange?: (value?: string) => void;
    onTagRemove?: () => void;
    onchange?: (value: string | undefined, event: Event) => void;
    onclear?: () => void;
    onfocus?: (event: Event) => void;
    onblur?: (event: Event) => void;
    onkeydown?: (event: KeyboardEvent) => void;
  }

  let {
    id,
    value = $bindable(''),
    tag,
    placeholder,
    shortcutKeys,
    onValueChange,
    onTagRemove,
    onchange,
    onclear,
    onfocus,
    onblur,
    onkeydown,
  }: Props = $props();

  const wrapperClass = [
    'flex items-center gap-2 relative',
    'w-full flex-1',
    'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900',
    'transition',
    'rounded-md',
  ];
  const inputClass = $derived([
    'pr-12 w-full',
    'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900',
    'transition',
    tag ? 'rounded-r-md' : 'rounded-md',
  ]);
  const tagClass = ['flex items-center gap-1', 'ml-1.5 pl-2 pr-1', 'transition', 'rounded-sm'];
  const clearButtonClass = 'absolute right-2';
  const shortcutKeysClass = 'absolute right-2 flex gap-1 pointer-events-none';

  let inputRef: HTMLInputElement | undefined = $state();
  let showClearButton = $derived(!!value);
  let isFocused = $state(false);

  $effect(() => {
    onValueChange?.(value);
  });

  export function focus(): void {
    inputRef?.focus();
  }

  function handleTagClick(): void {
    onTagRemove?.();
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
  {#if tag}
    <Button class={tagClass} size="small" onclick={handleTagClick}>
      <span>{tag}</span>
      <Icon src={XMark} theme="outlined" class="size-4" />
    </Button>
  {/if}
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
