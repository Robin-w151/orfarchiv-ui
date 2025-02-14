<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { NOTIFICATION_COPY_LINK_TIMEOUT } from '$lib/configs/client';
  import type { Story } from '$lib/models/story';
  import notifications from '$lib/stores/notifications';
  import { ClipboardDocument, Share } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    story: Story;
    class?: string;
    onClose?: () => void;
  }

  let { story, class: clazz, onClose }: Props = $props();

  let shareData = $derived(story?.url ? { text: story?.url } : undefined);
  let showShareButton = $derived(shareData && isWebShareAvailable(shareData));
  let showCopyToClipboardButton = $derived(isClipboardAvailable());

  function isWebShareAvailable(data: ShareData): boolean {
    return navigator.canShare?.(data) && !!navigator.share;
  }

  function isClipboardAvailable(): boolean {
    return !!navigator.clipboard?.writeText;
  }

  function handleShareArticleClick() {
    navigator.share(shareData);
    onClose?.();
  }

  async function handleCopyToClipboardClick() {
    const text = new Blob([story.url], { type: 'text/plain' });
    const html = new Blob(
      [`<a id="${story.id}" data-timestamp="${story.timestamp}" href="${story.url}">${story.title}</a>`],
      { type: 'text/html' },
    );

    const clipboardItem = new ClipboardItem({
      [text.type]: text,
      [html.type]: html,
    });

    navigator.clipboard.write([clipboardItem]);
    notifications.notify('Link kopiert', 'Der Link zum Artikel wurde in die Zwischenablage kopiert.', {
      forceAppNotification: true,
      timeoutInMs: NOTIFICATION_COPY_LINK_TIMEOUT,
    });

    onClose?.();
  }
</script>

{#if showShareButton}
  <Button class={clazz} customStyle onclick={handleShareArticleClick}>
    <Icon src={Share} theme="outlined" class="size-6" />
    <span>Artikel teilen</span>
  </Button>
{/if}
{#if showCopyToClipboardButton}
  <Button class={clazz} customStyle onclick={handleCopyToClipboardClick}>
    <Icon src={ClipboardDocument} theme="outlined" class="size-6" />
    <span>In Zwischenablage kopieren</span>
  </Button>
{/if}
