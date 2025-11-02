<script lang="ts">
  interface Props {
    key: string;
    class?: string;
  }

  let { key, class: clazz }: Props = $props();

  const baseClass = [
    'flex justify-center items-center',
    'px-1 py-0.5 min-w-5',
    'text-xs',
    'border-1 border-gray-400 dark:border-gray-500',
    'rounded-sm shadow-sm',
  ];
</script>

<kbd class={[...baseClass, clazz]}>{key}</kbd>
