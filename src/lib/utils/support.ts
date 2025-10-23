import { browser } from '$app/environment';

export function isMediaSessionAvailable(): boolean {
  return browser && 'MediaSession' in globalThis;
}

export function isTouchDevice(): boolean {
  return browser && 'matchMedia' in globalThis && globalThis.matchMedia?.('(pointer: coarse)')?.matches;
}

export function isCloseWatcherAvailable(): boolean {
  return browser && typeof CloseWatcher === 'function';
}

export function isViewTransitionAvailable(): boolean {
  return browser && 'startViewTransition' in document;
}
