<script lang="ts">
  import Story from '$lib/components/news/story/Story.svelte';
  import Section from '$lib/components/ui/content/Section.svelte';
  import SectionList from '$lib/components/ui/content/SectionList.svelte';
  import type { NewsBucket } from '$lib/models/news';

  interface Props {
    storyBuckets?: Array<NewsBucket>;
    isLoading?: boolean;
    onSelectStory?: ({ id, next }: { id: string; next: boolean }) => void;
  }

  let { storyBuckets, isLoading = false, onSelectStory }: Props = $props();

  const listClass = `cursor-pointer`;
</script>

{#if storyBuckets}
  {#each storyBuckets as bucket (bucket.name)}
    {#if bucket.stories.length > 0}
      <Section title={bucket.name} {isLoading}>
        <SectionList class={listClass}>
          {#each bucket.stories as story (story.id)}
            <Story {story} {onSelectStory} />
          {/each}
        </SectionList>
      </Section>
    {/if}
  {/each}
{/if}
