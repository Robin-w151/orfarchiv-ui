import { browser } from '$app/environment';

export function isMediaSessionAvailable(): boolean {
  return browser && 'MediaSession' in window;
}

export function isTouchDevice(): boolean {
  return browser && 'matchMedia' in window && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
}

export function isMacOsPlatform(): boolean {
  return (
    browser &&
    'userAgentData' in window.navigator &&
    !!window.navigator.userAgentData &&
    typeof window.navigator.userAgentData === 'object' &&
    'platform' in window.navigator.userAgentData &&
    !!window.navigator.userAgentData.platform &&
    typeof window.navigator.userAgentData.platform === 'string' &&
    /^mac\s*os(?:x)?$/i.test(window.navigator.userAgentData.platform)
  );
}

export function isCloseWatcherAvailable(): boolean {
  return browser && typeof CloseWatcher === 'function';
}
