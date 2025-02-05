<script lang="ts">
  import Link from '$lib/components/shared/controls/Link.svelte';
  import QuestionMarkCircleIcon from '$lib/components/shared/icons/outline/QuestionMarkCircleIcon.svelte';

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
  <QuestionMarkCircleIcon />
  <span>Kundendienst</span>
</Link>
