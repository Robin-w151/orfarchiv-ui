<script lang="ts">
  import { focusTrap } from '$lib/utils/focusTrap';
  import { scaleFade } from '$lib/utils/transitions';
  import { XMark } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { onDestroy, onMount, type Snippet } from 'svelte';
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

  let dialogRef = $state<HTMLDialogElement | undefined>(undefined);
  let oldOverflowValue: string | undefined;
  let oldActiveElement: Element | null;

  const baseBackdropClass = ['backdrop:bg-black/50 backdrop:backdrop-blur-xs'];
  const baseModalClass = [
    'modal',
    'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'max-w-[min(calc(100dvw-2rem),var(--breakpoint-lg))] max-h-[min(100dvh-2rem,64rem)]',
    'bg-white dark:bg-gray-900',
    'rounded-xl overflow-auto',
  ];
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

    dialogRef?.showModal();
  });

  onDestroy(() => {
    document.documentElement.style.overflow = oldOverflowValue ?? '';

    if (oldActiveElement && 'focus' in oldActiveElement && typeof oldActiveElement.focus === 'function') {
      oldActiveElement.focus();
    }

    dialogRef?.close();
  });

  function handleCloseClick(): void {
    onClose?.();
  }

  function handleModalClose(): void {
    onClose?.();
  }
</script>

<svelte:document />

{#if children}
  <AccessibleTransition
    element="dialog"
    class={[...baseModalClass, ...baseBackdropClass, modalClass, backdropClass]}
    closedby={closeOnBackdropClick ? 'any' : 'closerequest'}
    transition={scaleFade}
    aria-label={label}
    onclose={handleModalClose}
    data-testid="modal"
    bind:elementRef={dialogRef}
    {@attach focusTrap({ skipInitialFocus: true })}
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
{/if}
