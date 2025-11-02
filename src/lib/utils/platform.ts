export function isMac(): boolean {
  if (typeof globalThis === 'undefined') {
    return false;
  }

  if (
    'userAgentData' in navigator &&
    navigator.userAgentData &&
    typeof navigator.userAgentData === 'object' &&
    'platform' in navigator.userAgentData
  ) {
    return navigator.userAgentData.platform === 'macOS';
  }

  return /Mac OS X|Macintosh/.test(navigator.userAgent);
}
