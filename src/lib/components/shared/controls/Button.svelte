<script lang="ts">
  import type { Snippet } from 'svelte';
  import { type BtnType, buttonClassFn, type Size } from './button.styles';
  import type { KeyboardEventHandler, MouseEventHandler } from 'svelte/elements';
  import clsx from 'clsx';

  let buttonRef: HTMLButtonElement | undefined = $state();

  interface Props {
    type?: 'button' | 'reset' | 'submit';
    btnType?: BtnType;
    size?: Size;
    iconOnly?: boolean;
    round?: boolean;
    disabled?: boolean;
    title?: string;
    class?: string | Array<string>;
    customStyle?: boolean;
    children?: Snippet;
    onclick?: MouseEventHandler<HTMLButtonElement>;
    onkeydown?: KeyboardEventHandler<HTMLButtonElement>;
  }

  let {
    type = 'button',
    btnType = 'primary',
    size = 'normal',
    iconOnly = false,
    round = false,
    disabled = undefined,
    title = undefined,
    class: clazz = undefined,
    customStyle = false,
    children,
    onclick,
    onkeydown,
  }: Props = $props();

  let buttonClass = $derived(
    buttonClassFn({
      btnType,
      size,
      iconOnly,
      round,
      clazz: clsx(clazz),
      customStyle,
    }),
  );

  export function focus(): void {
    buttonRef?.focus();
  }
</script>

<button
  class={buttonClass}
  {type}
  {disabled}
  {title}
  aria-label={iconOnly ? title : undefined}
  {onclick}
  {onkeydown}
  bind:this={buttonRef}
>
  {@render children?.()}
</button>
