<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: clazz = 'w-6 h-6' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  class={clazz}
  fill="none"
  viewBox="0 0 24 24"
  stroke-width="1.5"
  stroke="currentColor"
>
  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
</svg>
