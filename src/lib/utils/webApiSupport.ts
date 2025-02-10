import { browser } from '$app/environment';

export function isMediaSessionAvailable(): boolean {
  return browser && 'MediaSession' in window;
}
