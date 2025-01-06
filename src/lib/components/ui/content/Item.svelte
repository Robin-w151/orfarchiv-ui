<script lang="ts">
  import clsx from 'clsx';
  import computeScrollIntoView from '$lib/utils/computeScrollIntoView';
  import { defaultPadding } from '$lib/utils/styles';
  import type { Snippet } from 'svelte';
  import type { KeyboardEventHandler, MouseEventHandler } from 'svelte/elements';

  interface Props {
    noFlex?: boolean;
    noColumn?: boolean;
    noGap?: boolean;
    noPadding?: boolean;
    class?: string;
    children?: Snippet;
    onclick?: MouseEventHandler<HTMLLIElement>;
    onkeydown?: KeyboardEventHandler<HTMLLIElement>;
  }

  let {
    noFlex = false,
    noColumn = false,
    noGap = false,
    noPadding = false,
    class: clazz,
    children,
    onclick,
    onkeydown,
  }: Props = $props();

  let itemRef: HTMLLIElement | undefined = $state();

  const itemClass = clsx([
    !noFlex && 'flex',
    noColumn ? 'flex-row items-center justify-between' : 'flex-col',
    !noGap && 'gap-3',
    !noPadding && defaultPadding,
    'text-gray-800 dark:text-gray-300',
    'outline-none',
    clazz,
  ]);

  export function scrollIntoView(): void {
    if (itemRef) {
      const actions = computeScrollIntoView(itemRef, {
        scrollMode: 'if-needed',
        block: 'start',
        viewportInset: { y: 80 },
      });
      const canSmoothScroll = 'scrollBehavior' in document.body.style;
      actions.forEach(({ el, top, left }) => {
        const topWithOffset = Math.max(top - 80, 0);
        if (el.scroll && canSmoothScroll) {
          el.scroll({ top: topWithOffset, left, behavior: 'smooth' });
        } else {
          el.scrollTop = topWithOffset;
          el.scrollLeft = left;
        }
      });
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<li class={itemClass} {onclick} {onkeydown} bind:this={itemRef}>
  {@render children?.()}
</li>
