<script lang="ts">
  import { createCloseWatcher } from '$lib/utils/closeWatcher';
  import { focusTrap } from '$lib/utils/focusTrap';
  import { scaleFade } from '$lib/utils/transitions';
  import { XMark } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import Portal from 'svelte-portal';
  import Button from '../controls/Button.svelte';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';

  interface Props {
    label: string;
    closeOnBackdropClick?: boolean;
    backdropClass?: string;
    modalClass?: string;
    onClose?: () => void;
    children?: Snippet;
  }

  let { label, backdropClass, modalClass, onClose, children, closeOnBackdropClick = false }: Props = $props();

  let oldOverflowValue: string | undefined;
  let oldActiveElement: Element | null;

  const closeWatcher = createCloseWatcher({
    onClose,
  });

  const baseBackdropClass = [
    'flex items-center justify-center',
    'fixed top-0 left-0 right-0 bottom-0 z-50',
    'p-4 sm:p-8',
    'bg-black/50 backdrop-blur-xs',
  ];
  const baseModalClass = ['modal', 'max-w-screen-lg', 'bg-white dark:bg-gray-900', 'rounded-xl overflow-auto'];
  const headerClass = [
    'flex justify-end gap-2 sticky top-0',
    'px-4 lg:px-12 pt-4 lg:pt-12 pb-4',
    'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xs',
  ];
  const contentClass = ['px-4 pb-4 lg:px-12 lg:pb-12 max-w-full max-h-full'];

  onMount(() => {
    oldOverflowValue = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    oldActiveElement = document.activeElement;

    closeWatcher.setup();
  });

  onDestroy(() => {
    document.documentElement.style.overflow = oldOverflowValue ?? '';

    if (oldActiveElement && 'focus' in oldActiveElement && typeof oldActiveElement.focus === 'function') {
      oldActiveElement.focus();
    }

    closeWatcher.cleanup();
  });

  function handleCloseClick(): void {
    onClose?.();
  }

  function handleBackdropClick(): void {
    if (closeOnBackdropClick) {
      onClose?.();
    }
  }

  function handleModalClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!closeWatcher.isActive) {
        event.preventDefault();
        onClose?.();
      }
    }
  }
</script>

<svelte:document on:keydown={handleKeyDown} />

{#if children}
  <Portal target="body">
    <AccessibleTransition
      class={[...baseBackdropClass, backdropClass]}
      onclick={handleBackdropClick}
      {@attach focusTrap({ skipInitialFocus: true })}
    >
      <AccessibleTransition
        class={[...baseModalClass, modalClass]}
        style="max-height: min(100%, 64rem);"
        transition={scaleFade}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-testid="modal"
        onclick={handleModalClick}
      >
        <div class={headerClass}>
          <Button btnType="secondary" size="large" iconOnly round title="Schließen" onclick={handleCloseClick}>
            <Icon src={XMark} theme="outlined" class="size-6 lg:size-8" />
          </Button>
        </div>
        <div class={contentClass}>
          {@render children?.()}
        </div>
      </AccessibleTransition>
    </AccessibleTransition>
  </Portal>
{/if}
