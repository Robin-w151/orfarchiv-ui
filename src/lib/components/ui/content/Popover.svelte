<script lang="ts">
  import { type BtnType, buttonClassFn, type Size } from '../controls/button.styles';
  import type { Snippet } from 'svelte';
  import {
    autoUpdate,
    flip,
    offset,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
  } from '@skeletonlabs/floating-ui-svelte';

  interface Props {
    btnType?: BtnType;
    size?: Size;
    iconOnly?: boolean;
    round?: boolean;
    title?: string | undefined;
    disabled?: boolean | undefined;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
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
    buttonContent,
    popoverContent,
  }: Props = $props();

  let open = $state(false);

  const floating = useFloating({
    whileElementsMounted: autoUpdate,
    placement,
    get open() {
      return open;
    },
    onOpenChange: (v) => {
      open = v;
    },
    get middleware() {
      return [offset(10), flip()];
    },
  });
  const role = useRole(floating.context);
  const click = useClick(floating.context);
  const dismiss = useDismiss(floating.context);
  const interactions = useInteractions([role, click, dismiss]);
  const dropdownContentClass = 'z-40';

  let dropdownButtonClass = $derived(buttonClassFn({ btnType, size, iconOnly, round }));
</script>

<div>
  <button
    class={dropdownButtonClass}
    {disabled}
    {title}
    {...interactions.getReferenceProps()}
    bind:this={floating.elements.reference}
  >
    {@render buttonContent?.()}
  </button>
  {#if open}
    <div
      class={dropdownContentClass}
      data-testid="popover"
      style={floating.floatingStyles}
      {...interactions.getFloatingProps()}
      bind:this={floating.elements.floating}
    >
      {@render popoverContent?.(() => (open = false))}
    </div>
  {/if}
</div>
