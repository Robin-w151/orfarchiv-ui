<script lang="ts">
  import Button from '$lib/components/ui/controls/Button.svelte';
  import BookmarkIcon from '$lib/components/ui/icons/outline/BookmarkIcon.svelte';
  import BookmarkSlashIcon from '$lib/components/ui/icons/outline/BookmarkSlashIcon.svelte';
  import { NOTIFICATION_BOOKMARK_TIMEOUT } from '$lib/configs/client';
  import type { Story } from '$lib/models/story';
  import bookmarks from '$lib/stores/bookmarks';
  import notifications from '$lib/stores/notifications';

  interface Props {
    story: Story;
    class?: string;
    onClose?: () => void;
  }

  let { story, class: clazz, onClose }: Props = $props();

  function handleAddToBookmarksClick() {
    bookmarks.add(story);
    notifications.notify('Lesezeichen hinzugefügt', 'Der Artikel wurde zu deinen Lesezeichen hinzugefügt.', {
      forceAppNotification: true,
      timeoutInMs: NOTIFICATION_BOOKMARK_TIMEOUT,
    });
    onClose?.();
  }

  function handleRemoveFromBookmarksClick() {
    bookmarks.remove(story);
    notifications.notify('Lesezeichen entfernt', 'Der Artikel wurde von deinen Lesezeichen entfernt.', {
      forceAppNotification: true,
      timeoutInMs: NOTIFICATION_BOOKMARK_TIMEOUT,
    });
    onClose?.();
  }
</script>

{#if story.isBookmarked}
  <Button class={clazz} customStyle onclick={handleRemoveFromBookmarksClick}>
    <BookmarkSlashIcon />
    <span>Von Lesezeichen entfernen</span>
  </Button>
{:else}
  <Button class={clazz} customStyle onclick={handleAddToBookmarksClick}>
    <BookmarkIcon />
    <span>Zu Lesezeichen hinzufügen</span>
  </Button>
{/if}
