<script lang="ts">
  import Radio from '$lib/components/shared/controls/Radio.svelte';

  interface Props {
    id: string;
    name: string;
    label: string;
    value: string;
    onchange?: (value: string) => void;
  }

  let { id, name, label, value, onchange }: Props = $props();

  let group = $state(`${value}-1`);
</script>

<fieldset class="flex flex-col gap-1">
  <Radio id="{id}-1" {name} label="{label} 1" value="{value}-1" bind:group {onchange} />
  <Radio id="{id}-2" {name} label="{label} 2" value="{value}-2" bind:group {onchange} />
  <Radio id="{id}-3" {name} label="{label} 3" value="{value}-3" bind:group {onchange} />
</fieldset>
