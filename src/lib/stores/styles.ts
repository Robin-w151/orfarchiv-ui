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

export default { subscribe, setColorScheme } as StylesStore;
