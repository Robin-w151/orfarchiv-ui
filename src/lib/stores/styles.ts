import { browser } from '$app/environment';
import { STYLES_STORE_NAME } from '$lib/configs/client';
import { persisted } from 'svelte-persisted-store';
import type { Readable } from 'svelte/store';

export type ColorScheme = 'light' | 'dark' | 'system';

export interface StylesStoreProps {
  colorScheme: ColorScheme;
}

export interface StylesStore extends Readable<StylesStoreProps>, Partial<StylesStoreProps> {
  setColorScheme: (colorScheme: ColorScheme) => void;
}

const initialState: StylesStoreProps = { colorScheme: 'system' };

sanitizeLocalStorage();
const { subscribe, update } = persisted<StylesStoreProps>(STYLES_STORE_NAME, initialState);

function sanitizeLocalStorage(): void {
  if (!browser) {
    return;
  }

  function persist(styles: StylesStoreProps): void {
    localStorage.setItem(STYLES_STORE_NAME, JSON.stringify(styles));
  }

  const stylesValue = localStorage.getItem(STYLES_STORE_NAME);
  if (!stylesValue) {
    persist(initialState);
    return;
  }

  try {
    const styles: Partial<StylesStoreProps> = JSON.parse(stylesValue);

    if (!('colorScheme' in styles)) {
      styles.colorScheme = initialState.colorScheme;
    }

    persist(styles as StylesStoreProps);
  } catch (_error) {
    persist(initialState);
  }
}

function setColorScheme(colorScheme: ColorScheme): void {
  update((styles) => ({ ...styles, colorScheme }));
}

/**
 * Returns the effective (visually active) color scheme.
 * Resolves 'system' against the OS preference via matchMedia.
 * @param colorScheme — the store's colorScheme value ('light' | 'dark' | 'system')
 *                      or undefined as a safety net (falls back to 'system')
 */
export function getEffectiveColorScheme(colorScheme: ColorScheme | undefined): ColorScheme {
  if (colorScheme === 'system') {
    if (browser) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return colorScheme ?? 'system';
}

export default { subscribe, setColorScheme } as StylesStore;
