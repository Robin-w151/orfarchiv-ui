<script lang="ts">
  import { NOTIFICATION_NEW_VERSION_AVAILABLE } from '#lib/configs/client.ts';
  import notifications from '#lib/stores/notifications.ts';
  import { listenForUpdates } from '#lib/utils/updateListener.ts';
  import { onMount } from 'svelte';
  import SpinningDotsIndicator from '#lib/components/shared/loading/SpinningDotsIndicator.svelte';

  let isRestarting = $state(false);

  onMount(async () => {
    listenForUpdates(({ restart }) => {
      notifications.notify(
        'Neue Version verfügbar',
        'Möchten Sie die Applikation jetzt neu starten und aktualisieren?',
        {
          uniqueCategory: NOTIFICATION_NEW_VERSION_AVAILABLE,
          forceAppNotification: true,
          onAccept: () => {
            isRestarting = true;
            restart();
          },
        },
      );
    });
  });
</script>

{#if isRestarting}
  <SpinningDotsIndicator />
{/if}
