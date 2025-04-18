<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import Portal from 'svelte-portal';
  import Button from '../controls/Button.svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { XMark } from '@steeze-ui/heroicons';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';
  import { rollFade } from '$lib/utils/transitions';
  import { focusTrap } from '$lib/utils/focusTrap';

  interface Props {
    label: string;
    closeOnBackdropClick?: boolean;
    backdropClass?: string;
    modalClass?: string;
    onClose?: () => void;
    children?: Snippet;
  }

  let { label, backdropClass, modalClass, onClose, children, closeOnBackdropClick = false }: Props = $props();

  let closeButtonRef: Button | undefined = $state();
  let oldOverflowValue: string | undefined;
  let oldActiveElement: Element | null;

  const baseBackdropClass = [
    'flex items-center justify-center',
    'fixed top-0 left-0 right-0 bottom-0 z-50',
    'p-8',
    'bg-black bg-opacity-50 backdrop-blur-sm',
  ];
  const baseModalClass = [
    'flex flex-col gap-2',
    'pt-4 lg:pt-12',
    'max-w-screen-lg max-h-full',
    'bg-white dark:bg-gray-900',
    'rounded-xl',
  ];
  const headerClass = ['flex justify-end gap-2 px-4 lg:px-12'];
  const contentClass = ['px-4 pb-4 lg:px-12 lg:pb-12 max-w-full max-h-full overflow-auto'];

  onMount(() => {
    oldOverflowValue = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    oldActiveElement = document.activeElement;
    closeButtonRef?.focus();
  });

  onDestroy(() => {
    document.documentElement.style.overflow = oldOverflowValue ?? '';

    if (oldActiveElement && 'focus' in oldActiveElement && typeof oldActiveElement.focus === 'function') {
      oldActiveElement.focus();
    }
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
      event.preventDefault();
      onClose?.();
    }
  }
</script>

<svelte:document on:keydown={handleKeyDown} />

{#if children}
  <Portal target="body">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class={[...baseBackdropClass, backdropClass]} onclick={handleBackdropClick} use:focusTrap={{}}>
      <AccessibleTransition
        class={[...baseModalClass, modalClass]}
        transition={rollFade}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-testid="modal"
        onclick={handleModalClick}
      >
        <div class={headerClass}>
          <Button
            btnType="secondary"
            size="large"
            iconOnly
            round
            title="Schließen"
            bind:this={closeButtonRef}
            onclick={handleCloseClick}
          >
            <Icon src={XMark} theme="outlined" class="size-8" />
          </Button>
        </div>
        <div class={contentClass}>
          {@render children?.()}
        </div>
      </AccessibleTransition>
    </div>
  </Portal>
{/if}
