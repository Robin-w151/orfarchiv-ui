import type { Info } from '$lib/models/info';
import { getContext, setContext } from 'svelte';

interface InfoStoreInterface {
  apiVersion: number | undefined;
  semanticSearchEnabled: boolean;
  storeInfo: (info: Info) => void;
}

class InfoStore implements InfoStoreInterface {
  private info = $state<Info | undefined>(undefined);

  apiVersion = $derived(this.info?.apiVersion);
  semanticSearchEnabled = $derived(this.info?.semanticSearchEnabled ?? false);

  storeInfo = (info: Info) => {
    this.info = info;
  };
}

const DEFAULT_KEY = Symbol('root_info_store');

export function getInfoStore(key: symbol = DEFAULT_KEY): InfoStoreInterface {
  return getContext(key);
}

export function setInfoStore(key: symbol = DEFAULT_KEY): InfoStoreInterface {
  const infoStore = new InfoStore();
  return setContext(key, infoStore);
}
