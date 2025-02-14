<script lang="ts">
  import type { OANotification } from '$lib/models/notifications';
  import notifications from '$lib/stores/notifications';
  import { defaultGap, defaultPadding } from '$lib/utils/styles';
  import { onMount } from 'svelte';
  import AccessibleTransition from '../transitions/AccessibleTransition.svelte';
  import Button from './Button.svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { Check, XMark } from '@steeze-ui/heroicons';

  interface Props {
    notification: OANotification;
  }

  let { notification }: Props = $props();

  const notificationClass = `
    flex justify-between items-center ${defaultGap}
    ${defaultPadding}
    w-full max-w-[768px]
    text-gray-900 dark:text-gray-200
    bg-gray-100 dark:bg-gray-800
    focus:outline-none focus:ring-2 ring-blue-700 dark:ring-blue-500
    rounded-lg shadow-md dark:shadow-2xl
  `;
  const contentClass = `
    flex flex-col ${defaultGap}
  `;
  const actionsClass = `
    flex items-center ${defaultGap}
  `;

  let closeButtonRef: Button | undefined = $state();

  $effect(() => {
    focusLatestNotification($notifications);
  });

  onMount(() => {
    focus();
  });

  function focus(): void {
    closeButtonRef?.focus();
  }

  function focusLatestNotification(notifications: Array<OANotification>): void {
    if (notification.id === notifications[notifications.length - 1]?.id) {
      focus();
    }
  }

  function handleAcceptClick(event: Event): void {
    event.stopPropagation();
    notifications.accept(notification.id);
  }

  function handleCloseClick(event: Event): void {
    event.stopPropagation();
    notifications.remove(notification.id);
  }
</script>

<AccessibleTransition class={notificationClass} onlyIn>
  <div class={contentClass}>
    <strong>{notification.title}</strong>
    <span>{notification.text}</span>
  </div>
  <div class={actionsClass}>
    {#if notification.options?.onAccept}
      <Button btnType="monochrome" iconOnly round title="Bestätigen" onclick={handleAcceptClick}>
        <Icon src={Check} theme="outlined" class="size-6" />
      </Button>
    {/if}
    <Button btnType="monochrome" iconOnly round title="Schließen" onclick={handleCloseClick} bind:this={closeButtonRef}>
      <Icon src={XMark} theme="outlined" class="size-6" />
    </Button>
  </div>
</AccessibleTransition>
