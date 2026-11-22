import { browser } from '$app/env';
import { SYNC_DEVICE_NAME_FALLBACK, SYNC_DEVICE_NAME_MAX_LENGTH, SYNC_STORE_NAME } from '#lib/configs/client.ts';
import { SyncDeviceName, SyncSecret, type SyncSettings } from '#lib/models/sync.ts';
import { normalizeSecret } from '#lib/services/sync/syncCrypto.ts';
import { uuid } from '#lib/utils/uuid.ts';
import { Effect, Result, Schema } from 'effect';
import { persisted } from 'svelte-persisted-store';

const DEVICE_PLATFORMS = [
  { pattern: /Android/, label: 'Android' },
  { pattern: /iPhone|iPod/, label: 'iPhone' },
  { pattern: /iPad/, label: 'iPad' },
  { pattern: /CrOS/, label: 'ChromeOS' },
  { pattern: /Windows/, label: 'Windows' },
  { pattern: /Macintosh|Mac OS X/, label: 'macOS' },
  { pattern: /Linux/, label: 'Linux' },
] as const;

const DEVICE_BROWSERS = [
  { pattern: /SamsungBrowser\//, label: 'Samsung Internet' },
  { pattern: /EdgA?\/|EdgiOS\//, label: 'Edge' },
  { pattern: /OPR\/|OPiOS\//, label: 'Opera' },
  { pattern: /Firefox\/|FxiOS\//, label: 'Firefox' },
  { pattern: /Chrome\/|CriOS\//, label: 'Chrome' },
  { pattern: /Version\/.*Safari\//, label: 'Safari' },
] as const;

const isSyncSecret = Schema.is(SyncSecret);
const isSyncDeviceName = Schema.is(SyncDeviceName);

export function deriveDeviceName(userAgent: string) {
  const platform = DEVICE_PLATFORMS.find(({ pattern }) => pattern.test(userAgent))?.label;
  const browserName = DEVICE_BROWSERS.find(({ pattern }) => pattern.test(userAgent))?.label;
  const name = [platform, browserName].filter(Boolean).join(' · ');
  return name || SYNC_DEVICE_NAME_FALLBACK;
}

export function parseStoredSyncSettings(value: string | null, defaultDeviceName: string) {
  const defaults: SyncSettings = { deviceName: defaultDeviceName };
  if (!value) {
    return defaults;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') {
      return defaults;
    }

    const secret = 'secret' in parsed && isSyncSecret(parsed.secret) ? parsed.secret : undefined;
    const deviceName =
      'deviceName' in parsed && isSyncDeviceName(parsed.deviceName) ? parsed.deviceName : defaultDeviceName;
    return toSyncSettings(secret, deviceName);
  } catch {
    return defaults;
  }
}

function toSyncSettings(secret: string | undefined, deviceName: string) {
  return secret ? { secret, deviceName } : { deviceName };
}

function normalizeDeviceName(name: string, defaultDeviceName: string) {
  const deviceName = name.trim().slice(0, SYNC_DEVICE_NAME_MAX_LENGTH).trim();
  return deviceName || defaultDeviceName;
}

const defaultDeviceName = deriveDeviceName(browser ? navigator.userAgent : '');
const initialState: SyncSettings = { deviceName: defaultDeviceName };

sanitizeLocalStorage();
const syncSettings = createSyncSettingsStore();

function sanitizeLocalStorage() {
  if (!browser) {
    return;
  }

  const settings = parseStoredSyncSettings(localStorage.getItem(SYNC_STORE_NAME), defaultDeviceName);
  localStorage.setItem(SYNC_STORE_NAME, JSON.stringify(settings));
}

function createSyncSettingsStore() {
  const { subscribe, update } = persisted<SyncSettings>(SYNC_STORE_NAME, initialState);

  function generateSecret() {
    const secret = uuid();
    update((settings) => toSyncSettings(secret, settings.deviceName));
    return secret;
  }

  function setSecret(value: string) {
    const result = Effect.runSync(Effect.result(normalizeSecret(value)));
    if (Result.isSuccess(result)) {
      update((settings) => toSyncSettings(result.success, settings.deviceName));
    }
    return result;
  }

  function clearSecret() {
    update((settings) => toSyncSettings(undefined, settings.deviceName));
  }

  function setDeviceName(name: string) {
    update((settings) => toSyncSettings(settings.secret, normalizeDeviceName(name, defaultDeviceName)));
  }

  return {
    subscribe,
    generateSecret,
    setSecret,
    clearSecret,
    setDeviceName,
  };
}

export type SyncSettingsStore = typeof syncSettings;

export default syncSettings;
