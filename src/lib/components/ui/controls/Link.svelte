<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { MouseEventHandler } from 'svelte/elements';

  interface Props {
    href: string;
    target?: string;
    class?: string;
    customStyle?: boolean;
    children?: Snippet;
    onclick?: MouseEventHandler<HTMLAnchorElement>;
  }

  let { href, target = '_blank', customStyle = false, class: clazz, children, onclick }: Props = $props();

  let rel = target === '_blank' ? 'noopener noreferrer' : undefined;

  const linkClass = customStyle
    ? clazz
    : `
    text-blue-800 dark:text-blue-500 dark:hover:text-blue-700 hover:bg-blue-100
    focus:bg-blue-100 outline-none
    cursor-pointer
    ${clazz}
  `;
</script>

<a class={linkClass} {href} {target} {rel} {onclick}>
  {@render children?.()}
</a>
