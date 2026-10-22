<script lang="ts">
  import { NOTIFICATION_NETWORK_OFFLINE_WARNING } from '#lib/configs/client.ts';
  import notifications from '#lib/stores/notifications.ts';
  import { onlineStore } from '#lib/stores/svelte-legos/online.ts';
  import { logger } from '#lib/utils/logger.ts';

  const online = onlineStore();

  $effect(() => {
    warnIfOffline($online);
  });

  function warnIfOffline(online: boolean): void {
    if (online) {
      logger.info('network-status: online');
      notifications.removeAllCategory(NOTIFICATION_NETWORK_OFFLINE_WARNING);
    } else {
      logger.warn('network-status: offline');
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
