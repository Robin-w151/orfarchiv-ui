import { readable, type Readable } from 'svelte/store';
import { networkStore } from './network';

export function onlineStore(): Readable<boolean> {
  return readable(true, (set) => {
    const { subscribe } = networkStore();
    const unsub = subscribe((networkState) => {
      set(networkState.isOnline);
    });
    return unsub;
  });
}
