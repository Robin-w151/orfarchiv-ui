<script lang="ts">
  import notifications from '$lib/stores/notifications';
  import { defaultGap } from '$lib/utils/styles';
  import Notification from './Notification.svelte';

  const notificationsClass = `
    flex flex-col items-center ${defaultGap}
    fixed z-40 left-8 right-8 bottom-4 lg:bottom-8
  `;

  let appNotifications = $derived($notifications.filter((notification) => !notification.system));
</script>

<section class={notificationsClass} id="notifications">
  {#each appNotifications as notification (notification.id)}
    <Notification {notification} />
  {/each}
</section>
