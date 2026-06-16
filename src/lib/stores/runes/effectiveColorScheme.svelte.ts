import { MediaQuery } from 'svelte/reactivity';
import styles, { type ColorScheme } from '../styles';
import { fromStore } from 'svelte/store';
import { setContext } from 'svelte';
import { getContext } from 'svelte';

export interface EffectiveColorSchemeStoreInterface {
  effectiveColorScheme: ColorScheme;
}

export class EffectiveColorSchemeStore implements EffectiveColorSchemeStoreInterface {
  private prefersDarkColorScheme = new MediaQuery('(prefers-color-scheme: dark)');
  private styles = fromStore(styles);

  effectiveColorScheme = $derived.by(() => {
    const prefersDarkColorScheme = this.prefersDarkColorScheme.current;
    if (this.styles.current.colorScheme === 'system') {
      return prefersDarkColorScheme ? 'dark' : 'light';
    }

    return this.styles.current.colorScheme;
  });
}

const DEFAULT_KEY = Symbol('root_effective_color_scheme_store');

export function getEffectiveColorSchemeStore(key: symbol = DEFAULT_KEY): EffectiveColorSchemeStoreInterface {
  return getContext(key);
}

export function setEffectiveColorSchemeStore(key: symbol = DEFAULT_KEY): EffectiveColorSchemeStoreInterface {
  const effectiveColorSchemeStore = new EffectiveColorSchemeStore();
  return setContext(key, effectiveColorSchemeStore);
}
