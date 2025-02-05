<script lang="ts">
  import PopoverContent from '$lib/components/shared/content/PopoverContent.svelte';
  import type { Story } from '$lib/models/story';
  import { defaultMenuClass, defaultMenuItemClass } from '$lib/utils/styles';
  import BookmarkButton from './BookmarkButton.svelte';
  import OpenArticleButton from './OpenArticleButton.svelte';
  import OpenSupportButton from './OpenSupportButton.svelte';
  import ShareButton from './ShareButton.svelte';
  import Popover from '$lib/components/shared/content/Popover.svelte';
  import EllipsisVerticalIcon from '$lib/components/shared/icons/outline/EllipsisVerticalIcon.svelte';

  interface Props {
    story: Story;
  }

  let { story }: Props = $props();
</script>

<Popover btnType="secondary" iconOnly title="Weitere Optionen" placement="bottom-end">
  {#snippet buttonContent()}
    <EllipsisVerticalIcon />
  {/snippet}
  {#snippet popoverContent(onClose)}
    <PopoverContent class={defaultMenuClass}>
      <OpenArticleButton class={defaultMenuItemClass} {story} {onClose} />
      <BookmarkButton class={defaultMenuItemClass} {story} {onClose} />
      <ShareButton class={defaultMenuItemClass} {story} {onClose} />
      <OpenSupportButton class={defaultMenuItemClass} {onClose} />
    </PopoverContent>
  {/snippet}
</Popover>
