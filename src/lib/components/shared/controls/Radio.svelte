<script lang="ts">
  import { inputClass, labelClass, wrapperClass } from './checkbox.styles';

  interface Props {
    id: string;
    name: string;
    label: string;
    value: string;
    group: string;
    onchange?: (value: string) => void;
  }

  let { id, name, label, value, group = $bindable(), onchange }: Props = $props();

  function handleChange(): void {
    onchange?.(value);
  }
</script>

<span class={wrapperClass}>
  <input class={inputClass} type="radio" {id} {name} {value} bind:group onchange={handleChange} />
  <label class={labelClass} for={id}>{label}</label>
</span>
