<script lang="ts" generics="TValue extends string">
  import { inputClass, labelClass, wrapperClass } from './checkbox.styles';

  interface Props {
    id: string;
    name: string;
    label: string;
    value: TValue;
    group: TValue;
    onchange?: (value: TValue) => void;
    onclick?: (event: MouseEvent) => void;
    onkeydown?: (event: KeyboardEvent) => void;
  }

  let { id, name, label, value, group = $bindable(), onchange, onclick, onkeydown }: Props = $props();

  function handleChange(): void {
    onchange?.(value);
  }

  function handleClick(event: MouseEvent): void {
    onclick?.(event);
  }

  function handleKeydown(event: KeyboardEvent): void {
    onkeydown?.(event);
  }
</script>

<span class={wrapperClass}>
  <input
    class={inputClass}
    type="radio"
    {id}
    {name}
    {value}
    bind:group
    onchange={handleChange}
    onclick={handleClick}
    onkeydown={handleKeydown}
  />
  <label class={labelClass} for={id}>{label}</label>
</span>
