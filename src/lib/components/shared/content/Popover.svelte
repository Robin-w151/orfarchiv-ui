<script lang="ts">
  import {
    autoUpdate,
    flip,
    offset,
    shift,
    useClick,
    useDismiss,
    useFloating,
    useFocus,
    useHover,
    useInteractions,
    useRole,
  } from '@skeletonlabs/floating-ui-svelte';
  import type { Snippet } from 'svelte';
  import Portal from 'svelte-portal';
  import { type BtnType, buttonClassFn, type Size } from '../controls/button.styles';
  import { isCloseWatcherAvailable } from '$lib/utils/support';
  import { onDestroy } from 'svelte';

  type Placement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

  interface Props {
    btnType?: BtnType;
    size?: Size;
    iconOnly?: boolean;
    round?: boolean;
    title?: string | undefined;
    disabled?: boolean | undefined;
    placement?: Placement;
    appendTo?: string | HTMLElement;
    openOnFocus?: boolean;
    openOnHover?: boolean;
    openOnKeyboardClick?: boolean;
    delay?: number | { open?: number; close?: number };
    containerClass?: string | Array<string>;
    anchorRegionClass?: string | Array<string>;
    onVisibleChange?: (visible: boolean) => void;
    anchorContent?: Snippet<[Record<string, unknown>]>;
    buttonContent?: Snippet;
    popoverContent?: Snippet<[() => void]>;
  }

  let {
    btnType = 'primary',
    size = 'normal',
    iconOnly = false,
    round = false,
    title,
    disabled,
    placement = 'bottom',
    appendTo,
    openOnFocus = false,
    openOnHover = false,
    openOnKeyboardClick = true,
    delay,
    containerClass,
    anchorRegionClass,
    onVisibleChange,
    anchorContent,
    buttonContent,
    popoverContent,
  }: Props = $props();

  let open = $state(false);

  let closeWatcher: CloseWatcher | undefined;

  const floating = useFloating({
    whileElementsMounted: autoUpdate,
    get open() {
      return open;
    },
    onOpenChange: (v) => {
      if (v) {
        handleOpen();
      } else {
        handleClose();
      }
    },
    placement,
    get middleware() {
      return [offset(10), flip(), shift()];
    },
  });
  const role = useRole(floating.context);
  const click = useClick(floating.context, { keyboardHandlers: openOnKeyboardClick });
  const dismiss = useDismiss(floating.context, { escapeKey: !isCloseWatcherAvailable() });
  const interactions = useInteractions(
    [
      role,
      dismiss,
      click,
      openOnFocus ? useFocus(floating.context) : null,
      openOnHover ? useHover(floating.context, { delay }) : null,
    ].filter((props) => !!props),
  );

  const popoverContentClass = 'z-40';

  let popoverButtonClass = $derived(buttonClassFn({ btnType, size, iconOnly, round }));

  onDestroy(() => {
    cleanupCloseWatcher();
  });

  export function setOpen(newOpen: boolean): void {
    open = newOpen;
  }

  function handleOpen(): void {
    setupCloseWatcher();
    updateOpenState(true);
  }

  function handleClose(): void {
    if (closeWatcher) {
      closeWatcher.requestClose();
    } else {
      updateOpenState(false);
    }
  }

  function handleCloseWatcherClose(): void {
    cleanupCloseWatcher();
    updateOpenState(false);
  }

  function updateOpenState(newOpen: boolean): void {
    open = newOpen;
    onVisibleChange?.(newOpen);
  }

  function setupCloseWatcher(): void {
    cleanupCloseWatcher();

    closeWatcher = getCloseWatcher();
    closeWatcher?.addEventListener('close', handleCloseWatcherClose);
  }

  function cleanupCloseWatcher(): void {
    if (closeWatcher) {
      closeWatcher.removeEventListener('close', handleCloseWatcherClose);
      closeWatcher.destroy();
      closeWatcher = undefined;
    }
  }

  function getCloseWatcher(): CloseWatcher | undefined {
    return isCloseWatcherAvailable() ? new CloseWatcher() : undefined;
  }
</script>

{#snippet popoverContentWrapper()}
  <div
    class={popoverContentClass}
    data-testid="popover"
    style={floating.floatingStyles}
    {...interactions.getFloatingProps()}
    bind:this={floating.elements.floating}
  >
    {@render popoverContent?.(() => (open = false))}
  </div>
{/snippet}

<div class={containerClass}>
  {#if anchorContent}
    <div class={anchorRegionClass} bind:this={floating.elements.reference}>
      {@render anchorContent?.(interactions.getReferenceProps())}
    </div>
  {:else}
    <button
      class={popoverButtonClass}
      {disabled}
      {title}
      {...interactions.getReferenceProps()}
      bind:this={floating.elements.reference}
    >
      {@render buttonContent?.()}
    </button>
  {/if}
  {#if open}
    {#if appendTo}
      <Portal target={appendTo}>
        {@render popoverContentWrapper()}
      </Portal>
    {:else}
      {@render popoverContentWrapper()}
    {/if}
  {/if}
</div>
