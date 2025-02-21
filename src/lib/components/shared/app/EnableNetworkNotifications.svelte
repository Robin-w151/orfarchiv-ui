<script lang="ts">
  import { NOTIFICATION_NETWORK_OFFLINE_WARNING } from '$lib/configs/client';
  import notifications from '$lib/stores/notifications';
  import { onlineStore } from '$lib/stores/svelte-legos/online';

  const online = onlineStore();

  $effect(() => {
    warnIfOffline($online);
  });

  function warnIfOffline(online: boolean): void {
    if (!online) {
      notifications.notify(
        'Verbindung unterbrochen',
        'Bitte überprüfen Sie Ihre Netzwerkeinstellungen und stellen Sie sicher, dass Sie mit dem Internet verbunden sind.',
        {
          uniqueCategory: NOTIFICATION_NETWORK_OFFLINE_WARNING,
          forceAppNotification: true,
        },
      );
    }
  }
</script>
