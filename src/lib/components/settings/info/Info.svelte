<script lang="ts">
  import Section from '$lib/components/shared/content/Section.svelte';
  import Link from '$lib/components/shared/controls/Link.svelte';
  import SectionList from '$lib/components/shared/content/SectionList.svelte';
  import SimpleItem from '$lib/components/shared/content/SimpleItem.svelte';
  import { PUBLIC_APP_MODE } from '$env/static/public';

  const appVersion = import.meta.env.APP_VERSION;
  const appCommitHash = import.meta.env.APP_COMMIT_HASH;
  const sourceCodeUrl = 'https://github.com/Robin-w151/orfarchiv';
  const svelteKitUrl = 'https://kit.svelte.dev';
  const vercelUrl = 'https://vercel.com';
</script>

<Section class="grid-info" title="Info">
  <SectionList>
    <SimpleItem>
      <span>Version</span>
      <span
        ><Link href="{sourceCodeUrl}-ui/tree/v{appVersion}">{appVersion}</Link>
        {#if PUBLIC_APP_MODE === 'dev' && appCommitHash}
          <Link href="{sourceCodeUrl}-ui/tree/{appCommitHash}">({appCommitHash})</Link>
        {/if}</span
      >
    </SimpleItem>
    <SimpleItem>
      <span>Quellcode auf</span>
      <Link href={sourceCodeUrl}>GitHub</Link>
    </SimpleItem>
    <SimpleItem>
      <span>Powered by</span>
      <Link href={svelteKitUrl}>SvelteKit</Link>
    </SimpleItem>
    <SimpleItem>
      <span>Gehostet bei</span>
      <Link href={vercelUrl}>Vercel</Link>
    </SimpleItem>
  </SectionList>
</Section>
