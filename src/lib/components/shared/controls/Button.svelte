<script lang="ts">
  import type { Snippet } from 'svelte';
  import { type BtnType, buttonClassFn, type Size } from './button.styles';
  import type { KeyboardEventHandler, MouseEventHandler } from 'svelte/elements';

  let buttonRef: HTMLButtonElement | undefined = $state();

  interface Props {
    type?: 'button' | 'reset' | 'submit';
    btnType?: BtnType;
    size?: Size;
    iconOnly?: boolean;
    round?: boolean;
    disabled?: boolean | undefined;
    title?: string | undefined;
    class?: string | undefined;
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
      clazz,
      customStyle,
    }),
  );

  export function focus(): void {
    buttonRef?.focus();
  }
</script>

<button class={buttonClass} {type} {disabled} {title} {onclick} {onkeydown} bind:this={buttonRef}>
  {@render children?.()}
</button>
