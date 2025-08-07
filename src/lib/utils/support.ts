import { browser } from '$app/environment';

export function isMediaSessionAvailable(): boolean {
  return browser && 'MediaSession' in window;
}

export function isTouchDevice(): boolean {
  return browser && 'matchMedia' in window && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
}

export function isCloseWatcherAvailable(): boolean {
  return browser && typeof CloseWatcher === 'function';
}
