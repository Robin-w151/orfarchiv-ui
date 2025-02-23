<script lang="ts">
  import Popover from '$lib/components/shared/content/Popover.svelte';
  import PopoverContent from '$lib/components/shared/content/PopoverContent.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { defaultMenuClass } from '$lib/utils/styles';
  import { Trash } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    onRemoveAllBookmarks?: () => void;
    onRemoveAllViewedBookmarks?: () => void;
  }

  let { onRemoveAllBookmarks, onRemoveAllViewedBookmarks }: Props = $props();

  const menuDeleteItemClass = `
    flex gap-2
    p-2
    text-red-700 hover:text-red-600 focus:text-red-600 hover:bg-gray-100 focus:bg-gray-100
    dark:hover:bg-gray-800 dark:focus:bg-gray-800
    focus:outline-none
    rounded-lg cursor-pointer
    transition
  `;

  function handleRemoveAllBookmarksButtonClick(): void {
    onRemoveAllBookmarks?.();
  }

  function handleRemoveAllViewedBookmarksButtonClick(): void {
    onRemoveAllViewedBookmarks?.();
  }
</script>

<Popover btnType="secondary" iconOnly title="Lesezeichen löschen" placement="bottom-end">
  {#snippet buttonContent()}
    <Icon src={Trash} theme="outlined" class="size-6" />
  {/snippet}
  {#snippet popoverContent(onClose)}
    <PopoverContent class={defaultMenuClass}>
      <Button
        class={menuDeleteItemClass}
        customStyle
        onclick={() => {
          handleRemoveAllBookmarksButtonClick();
          onClose();
        }}
      >
        <Icon src={Trash} theme="outlined" class="size-6" />
        <span>Alle Lesezeichen löschen</span>
      </Button>
      <Button
        class={menuDeleteItemClass}
        customStyle
        onclick={() => {
          handleRemoveAllViewedBookmarksButtonClick();
          onClose();
        }}
      >
        <Icon src={Trash} theme="outlined" class="size-6" />
        <span>Gelesene Lesezeichen löschen</span>
      </Button>
    </PopoverContent>
  {/snippet}
</Popover>
