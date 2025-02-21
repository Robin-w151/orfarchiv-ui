<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { NOTIFICATION_BOOKMARK_TIMEOUT } from '$lib/configs/client';
  import type { Story } from '$lib/models/story';
  import bookmarks from '$lib/stores/bookmarks';
  import notifications from '$lib/stores/notifications';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { Bookmark, BookmarkSlash } from '@steeze-ui/heroicons';

  interface Props {
    story: Story;
    class?: string;
    onClose?: () => void;
  }

  let { story, class: clazz, onClose }: Props = $props();

  function handleAddToBookmarksClick(): void {
    bookmarks.add(story);
    notifications.notify('Lesezeichen hinzugefügt', 'Der Artikel wurde zu deinen Lesezeichen hinzugefügt.', {
      forceAppNotification: true,
      timeoutInMs: NOTIFICATION_BOOKMARK_TIMEOUT,
    });
    onClose?.();
  }

  function handleRemoveFromBookmarksClick(): void {
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
    <Icon src={BookmarkSlash} theme="outlined" class="size-6" />
    <span>Von Lesezeichen entfernen</span>
  </Button>
{:else}
  <Button class={clazz} customStyle onclick={handleAddToBookmarksClick}>
    <Icon src={Bookmark} theme="outlined" class="size-6" />
    <span>Zu Lesezeichen hinzufügen</span>
  </Button>
{/if}
