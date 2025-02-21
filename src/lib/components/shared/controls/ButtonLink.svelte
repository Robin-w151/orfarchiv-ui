<script lang="ts">
  import { preloadData } from '$app/navigation';
  import type { MouseEventHandler } from 'svelte/elements';
  import { buttonClassFn, type Size } from './button.styles';
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    title?: string;
    target?: string;
    size?: Size;
    iconOnly?: boolean;
    round?: boolean;
    preventDefault?: boolean;
    prefetch?: boolean;
    class?: string;
    children?: Snippet;
    onclick?: MouseEventHandler<HTMLAnchorElement>;
  }

  let {
    href,
    title,
    target,
    size = 'normal',
    iconOnly = false,
    round = false,
    preventDefault = false,
    prefetch = false,
    class: clazz,
    children,
    onclick,
  }: Props = $props();

  const buttonClass = buttonClassFn({
    btnType: 'secondary',
    size,
    iconOnly,
    round,
    clazz,
  });

  function triggerPrefetchRoute(): void {
    if (prefetch) {
      preloadData(href);
    }
  }

  function handleClick(event: MouseEvent & { currentTarget: HTMLAnchorElement }): void {
    if (preventDefault) {
      event.preventDefault();
    }
    onclick?.(event);
  }

  function handleFocus(): void {
    triggerPrefetchRoute();
  }

  function handleMouseOver(): void {
    triggerPrefetchRoute();
  }
</script>

<a
  class={buttonClass}
  {href}
  {target}
  {title}
  onclick={handleClick}
  onfocus={handleFocus}
  onmouseover={handleMouseOver}
>
  {@render children?.()}
</a>
