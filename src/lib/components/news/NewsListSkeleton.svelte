<script lang="ts">
  import Section from '$lib/components/shared/content/Section.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import StorySkeleton from './story/StorySkeleton.svelte';
</script>

<Section title="Aktuell" isLoading>
  <SectionList>
    {#each { length: 5 }}
      <StorySkeleton />
    {/each}
  </SectionList>
</Section>
