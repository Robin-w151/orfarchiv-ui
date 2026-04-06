<script lang="ts">
  import Popover from '$lib/components/shared/content/Popover.svelte';
  import PopoverContent from '$lib/components/shared/content/PopoverContent.svelte';
  import TextGradient from '$lib/components/shared/content/TextGradient.svelte';
  import Button from '$lib/components/shared/controls/Button.svelte';
  import { Tag } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    onSelectTag?: (tag: string) => void;
  }

  let { onSelectTag }: Props = $props();

  const tags = [
    'Inland',
    'Ausland',
    'Politik',
    'Wirtschaft',
    'Wissenschaft',
    'Technik',
    'Kultur',
    'Gesellschaft',
    'Religion',
    'Sport',
    'Gesundheit',
    'Umwelt',
    'Recht',
    'Help',
    'Chronik',
  ];

  const menuClass = `
    flex flex-col items-center gap-5
    p-3 w-90
    text-blue-700 dark:text-blue-500
  `;
  const menuSectionClass = `flex flex-col gap-3 w-full`;
  const menuSectionTitleClass = `flex gap-2 text-lg text-fuchsia-600 dark:text-fuchsia-400`;
  const menuTagsClass = `grid grid-cols-3 gap-x-3 gap-y-2 w-full`;
  const menuTagClass = `!w-full`;

  function handleSelectTag(tag: string): void {
    onSelectTag?.(tag);
  }
</script>

<Popover btnType="secondary" iconOnly title="Schlagwörter" placement="bottom-end" appendTo="body">
  {#snippet buttonContent()}
    <Icon src={Tag} theme="outlined" class="size-6" />
  {/snippet}
  {#snippet popoverContent({ onClose, transformOrigin })}
    <PopoverContent class={menuClass} {transformOrigin}>
      <section class={menuSectionClass}>
        <span class={menuSectionTitleClass}>
          <Icon src={Tag} theme="outlined" class="size-6" />
          <TextGradient>Schlagwörter</TextGradient>
        </span>
        <div class={menuTagsClass}>
          {#each tags as tag (tag)}
            <Button
              class={menuTagClass}
              btnType="secondary"
              size="small"
              onclick={() => {
                handleSelectTag(tag);
                onClose();
              }}
            >
              {tag}
            </Button>
          {/each}
        </div>
      </section>
    </PopoverContent>
  {/snippet}
</Popover>
