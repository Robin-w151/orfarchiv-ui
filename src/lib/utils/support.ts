import { browser } from '$app/environment';

export function isMediaSessionAvailable(): boolean {
  return browser && 'MediaSession' in window;
}

export function isTouchDevice(): boolean {
  return browser && window.matchMedia('(pointer: coarse)').matches;
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
    /mac\s*os/i.test(window.navigator.userAgentData.platform)
  );
}
