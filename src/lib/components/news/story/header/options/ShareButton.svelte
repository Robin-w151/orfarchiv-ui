<script lang="ts">
  import Button from '$lib/components/ui/controls/Button.svelte';
  import ClipboardDocumentIcon from '$lib/components/ui/icons/outline/ClipboardDocumentIcon.svelte';
  import ShareIcon from '$lib/components/ui/icons/outline/ShareIcon.svelte';
  import type { Story } from '$lib/models/story';

  export let story: Story;
  export let onClose: () => void;

  let clazz: string;
  export { clazz as class };

  $: shareData = story?.url ? { text: story?.url } : undefined;
  $: showShareButton = shareData && isWebShareAvailable(shareData);
  $: showCopyToClipboardButton = isClipboardAvailable();

  function isWebShareAvailable(data: ShareData): boolean {
    return navigator.canShare?.(data) && !!navigator.share;
  }

  function isClipboardAvailable(): boolean {
    return !!navigator.clipboard?.writeText;
  }

  function handleShareArticleClick() {
    navigator.share(shareData);
    onClose();
  }

  function handleCopyToClipboardClick() {
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
    onClose();
  }
</script>

{#if showShareButton}
  <Button class={clazz} customStyle on:click={handleShareArticleClick}>
    <ShareIcon />
    <span>Artikel teilen</span>
  </Button>
{/if}
{#if showCopyToClipboardButton}
  <Button class={clazz} customStyle on:click={handleCopyToClipboardClick}>
    <ClipboardDocumentIcon />
    <span>In Zwischenablage kopieren</span>
  </Button>
{/if}
