<script lang="ts">
  import Link from '$lib/components/shared/controls/Link.svelte';
  import type { Story } from '$lib/models/story';
  import { Newspaper } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  interface Props {
    story: Story;
    class?: string;
    onClose?: () => void;
  }

  let { story, class: clazz, onClose }: Props = $props();

  function handleOpenArticleClick() {
    onClose?.();
  }
</script>

<Link class={clazz} customStyle href={story.url} onclick={handleOpenArticleClick}>
  <Icon src={Newspaper} theme="outlined" class="size-6" />
  <span>In orf.at öffnen</span>
</Link>
