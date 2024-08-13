<script lang="ts">
  import Section from '$lib/components/ui/content/Section.svelte';
  import SectionList from '$lib/components/ui/content/SectionList.svelte';
  import StorySkeleton from './story/StorySkeleton.svelte';
</script>

<Section title="Aktuell" isLoading>
  <SectionList>
    {#each { length: 10 } as _, index}
      <StorySkeleton itemStyles="opacity: {100 - index * 10}%" />
    {/each}
  </SectionList>
</Section>
