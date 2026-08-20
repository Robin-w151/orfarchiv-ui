<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { Minus, XMark } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    onMinimize: () => void;
    onClose: () => void;
  }

  const { onMinimize, onClose }: Props = $props();

  const windowActionsClass = ['flex justify-end gap-2'];
</script>

<div class={windowActionsClass}>
  <Button btnType="monochrome" iconOnly round title="Minimieren" onclick={onMinimize}>
    <Icon src={Minus} theme="outlined" class="size-6" />
  </Button>
  <Button btnType="monochrome" iconOnly round title="Schließen" onclick={onClose}>
    <Icon src={XMark} theme="outlined" class="size-6" />
  </Button>
</div>
