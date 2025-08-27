<script lang="ts">
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { Story } from '$lib/models/story';
  import bookmarks from '$lib/stores/bookmarks';
  import { Eye, EyeSlash } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    story: Story;
    class?: string;
    onClose?: () => void;
  }

  let { story, class: clazz, onClose }: Props = $props();

  function handleMarkAsReadClick(): void {
    bookmarks.setIsViewed(story);
    onClose?.();
  }

  function handleMarkAsUnreadClick(): void {
    bookmarks.setIsNotViewed(story);
    onClose?.();
  }
</script>

{#if story.isViewed}
  <Button class={clazz} customStyle onclick={handleMarkAsUnreadClick}>
    <Icon src={EyeSlash} theme="outlined" class="size-6" />
    <span>Als ungelesen markieren</span>
  </Button>
{:else}
  <Button class={clazz} customStyle onclick={handleMarkAsReadClick}>
    <Icon src={Eye} theme="outlined" class="size-6" />
    <span>Als gelesen markieren</span>
  </Button>
{/if}
