<script lang="ts">
  import { startSearch } from '$lib/stores/newsEvents';

  function handleKeydown(event: KeyboardEvent): void {
    if (isSearchShortcut(event)) {
      event.preventDefault();
      startSearch.notify();
    }
  }

  function isSearchShortcut(event: KeyboardEvent): boolean {
    const { key, metaKey, ctrlKey } = event;
    return (metaKey || ctrlKey) && ['f', 'k'].includes(key);
  }
</script>

<svelte:document onkeydown={handleKeydown} />
