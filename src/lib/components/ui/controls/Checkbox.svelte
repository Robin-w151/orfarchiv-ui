<script lang="ts">
  import type { ChangeEventHandler } from 'svelte/elements';
  import { inputClass, labelClass, wrapperClass } from './checkbox.styles';

  interface Props {
    id: string;
    label: string;
    checked?: boolean;
    onchange?: ChangeEventHandler<HTMLInputElement>;
  }

  let { id, label, checked = $bindable(false), onchange }: Props = $props();
</script>

<span class={wrapperClass}>
  <input class={inputClass} {id} type="checkbox" bind:checked {onchange} />
  <label class={labelClass} for={id}>{label}</label>
</span>
