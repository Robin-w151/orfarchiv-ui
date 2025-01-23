<script lang="ts">
  import Notification from '$lib/components/ui/controls/Notification.svelte';

  interface Props {
    id: string;
    title: string;
    text: string;
    options?: {
      onAccept?: () => void;
      onClose?: () => void;
    };
  }

  let { ...notification }: Props = $props();
</script>

<Notification {notification} />
