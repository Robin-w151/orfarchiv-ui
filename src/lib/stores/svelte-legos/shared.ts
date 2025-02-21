import type { Readable, Writable } from 'svelte/store';

export interface ConfigurableWindow {
  /*
   * Specify a custom `window` instance, e.g. working with iframes or in testing environments.
   */
  window?: Window;
}

export const isClient = typeof window !== 'undefined';
export const defaultWindow = isClient ? window : undefined;

export function tryOnDestroy(_fn: () => void): void {
  // NOT IMPLEMENTED
}

export function writableToReadable<T>({ subscribe }: Writable<T>): Readable<T> {
  return { subscribe: subscribe };
}
