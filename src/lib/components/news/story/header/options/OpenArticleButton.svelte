<script lang="ts">
  import Link from '$lib/components/ui/controls/Link.svelte';
  import NewspaperIcon from '$lib/components/ui/icons/outline/NewspaperIcon.svelte';
  import type { Story } from '$lib/models/story';

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
  <NewspaperIcon />
  <span>In orf.at öffnen</span>
</Link>
