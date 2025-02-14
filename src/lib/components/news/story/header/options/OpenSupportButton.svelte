<script lang="ts">
  import Link from '$lib/components/shared/controls/Link.svelte';
  import { QuestionMarkCircle } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    class?: string;
    onClose?: () => void;
  }

  let { class: clazz, onClose }: Props = $props();

  function handleOpenSupportClick() {
    onClose?.();
  }
</script>

<Link
  class={clazz}
  customStyle
  href="https://der.orf.at/kontakt/orf-online-angebote100.html"
  onclick={handleOpenSupportClick}
>
  <Icon src={QuestionMarkCircle} theme="outlined" class="size-6" />
  <span>Kundendienst</span>
</Link>
