<script lang="ts">
  import { defaultBackground, defaultText } from '$lib/utils/styles';
  import { InformationCircle } from '@steeze-ui/heroicons';
  import { Icon, type IconSource } from '@steeze-ui/svelte-icon';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    message?: string;
    icon?: IconSource;
    actionsContent?: Snippet;
  }

  let { title, message, icon = InformationCircle, actionsContent }: Props = $props();

  const alertBoxClass = [
    'flex flex-col items-center gap-8 sm:gap-16 p-8 sm:p-32',
    'w-full',
    defaultText,
    defaultBackground,
  ];
  const alertBoxText = `flex flex-col gap-4 sm:gap-8`;
  const alertBoxTitle = `text-center text-xl sm:text-2xl`;
  const alertBoxMessage = `text-center`;
  const alertBoxIcon = `w-12 h-12 sm:w-24 sm:h-24`;
  const alertBoxActions = `flex flex-col md:flex-row items-center gap-2`;
</script>

<div class={alertBoxClass}>
  <Icon src={icon} theme="outlined" class={alertBoxIcon} />
  <div class={alertBoxText}>
    <span class={alertBoxTitle}>{title}</span>
    {#if message}
      <span class={alertBoxMessage}>{message}</span>
    {/if}
  </div>
  {#if actionsContent}
    <div class={alertBoxActions}>
      {@render actionsContent()}
    </div>
  {/if}
</div>
