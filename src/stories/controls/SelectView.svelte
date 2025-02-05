<script lang="ts">
  import Select from '$lib/components/shared/controls/Select.svelte';

  interface Props {
    id: string;
    value?: string;
    placeholder?: string;
    onchange?: (value?: string) => void;
  }

  let { id, value = $bindable(''), placeholder, onchange }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  <Select {id} {value} {placeholder} {onchange}>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
  </Select>
  <div class="flex flex-col gap-2">
    <span>Options</span>
    <ul class="ml-6 list-disc">
      <li>Option 1 = 1</li>
      <li>Option 2 = 2</li>
      <li>Option 3 = 3</li>
    </ul>
  </div>
</div>
