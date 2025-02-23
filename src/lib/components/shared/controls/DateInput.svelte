<script lang="ts">
  interface Props {
    id: string;
    value?: string | null;
    onchange?: (value?: string | null) => void;
  }

  let { id, value = $bindable(''), onchange }: Props = $props();

  const inputClass = `
    flex-1 w-full
    text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900
    focus:ring-0
    focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500
    rounded-md text-center
    transition
  `;

  let inputRef: HTMLInputElement | undefined = $state();

  $effect(() => {
    onchange?.(value);
  });

  export function focus(): void {
    inputRef?.focus();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      inputRef?.blur();
    }
  }
</script>

<input class={inputClass} type="date" {id} onkeydown={handleKeydown} bind:value bind:this={inputRef} />
