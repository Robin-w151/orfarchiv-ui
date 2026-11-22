import { Result } from 'effect';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import syncSettings, { deriveDeviceName, parseStoredSyncSettings } from './syncSettings';

const SECRET = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const DEFAULT_DEVICE_NAME = 'Android · Chrome';

describe('syncSettings', () => {
  describe('deriveDeviceName', () => {
    it.each([
      [
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
        'Android · Chrome',
      ],
      [
        'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
        'Android · Samsung Internet',
      ],
      ['Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0', 'Android · Firefox'],
      [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
        'iPhone · Safari',
      ],
      [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
        'iPhone · Chrome',
      ],
      [
        'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
        'iPad · Safari',
      ],
      ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:133.0) Gecko/20100101 Firefox/133.0', 'macOS · Firefox'],
      [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
        'macOS · Safari',
      ],
      [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
        'Windows · Edge',
      ],
      [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/114.0.0.0',
        'Windows · Opera',
      ],
      [
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Linux · Chrome',
      ],
      [
        'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'ChromeOS · Chrome',
      ],
      ['Mozilla/5.0 (X11; Linux x86_64) SomeUnknownBrowser/1.0', 'Linux'],
      ['SomeUnknownBrowser/1.0 Firefox/133.0', 'Firefox'],
      ['curl/8.11.0', 'Gerät'],
      ['', 'Gerät'],
    ])('derives the device name from %j', (userAgent, expected) => {
      expect(deriveDeviceName(userAgent)).toBe(expected);
    });
  });

  describe('parseStoredSyncSettings', () => {
    it.each([
      [null, 'missing value'],
      ['', 'empty value'],
      ['not json', 'invalid json'],
      ['null', 'null'],
      ['42', 'number'],
      ['"text"', 'string'],
      ['[]', 'array'],
      ['{}', 'empty object'],
      [JSON.stringify({ secret: 'abc', deviceName: '' }), 'invalid fields'],
      [JSON.stringify({ secret: SECRET.toUpperCase(), deviceName: 42 }), 'non-normalized secret and wrong type'],
      [JSON.stringify({ secret: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }), 'v1 uuid secret'],
      [JSON.stringify({ deviceName: ' untrimmed ' }), 'untrimmed device name'],
      [JSON.stringify({ deviceName: 'x'.repeat(41) }), 'too long device name'],
    ])('falls back to defaults for %j (%s)', (value, _label) => {
      expect(parseStoredSyncSettings(value, DEFAULT_DEVICE_NAME)).toEqual({ deviceName: DEFAULT_DEVICE_NAME });
    });

    it('keeps valid stored settings', () => {
      const value = JSON.stringify({ secret: SECRET, deviceName: 'Mein Handy' });
      expect(parseStoredSyncSettings(value, DEFAULT_DEVICE_NAME)).toEqual({ secret: SECRET, deviceName: 'Mein Handy' });
    });

    it('keeps valid fields when other fields are invalid', () => {
      expect(parseStoredSyncSettings(JSON.stringify({ secret: SECRET, deviceName: '' }), DEFAULT_DEVICE_NAME)).toEqual({
        secret: SECRET,
        deviceName: DEFAULT_DEVICE_NAME,
      });
      expect(
        parseStoredSyncSettings(JSON.stringify({ secret: 'abc', deviceName: 'Laptop' }), DEFAULT_DEVICE_NAME),
      ).toEqual({ deviceName: 'Laptop' });
    });

    it('drops unknown fields', () => {
      const value = JSON.stringify({ deviceName: 'x'.repeat(40), extra: true });
      expect(parseStoredSyncSettings(value, DEFAULT_DEVICE_NAME)).toEqual({ deviceName: 'x'.repeat(40) });
    });
  });

  describe('store', () => {
    beforeEach(() => {
      syncSettings.clearSecret();
      syncSettings.setDeviceName('Laptop');
    });

    it('starts without a secret', () => {
      expect(get(syncSettings).secret).toBeUndefined();
    });

    it('generates a lowercase UUIDv4 secret', () => {
      const secret = syncSettings.generateSecret();
      expect(secret).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(get(syncSettings)).toEqual({ secret, deviceName: 'Laptop' });
    });

    it('stores a normalized secret', () => {
      const result = syncSettings.setSecret(` ${SECRET.toUpperCase()} `);
      expect(Result.isSuccess(result)).toBe(true);
      expect(get(syncSettings).secret).toBe(SECRET);
    });

    it('rejects an invalid secret and keeps the current one', () => {
      syncSettings.setSecret(SECRET);
      const result = syncSettings.setSecret('abc');
      expect(Result.isFailure(result)).toBe(true);
      expect(Result.isFailure(result) ? result.failure._tag : undefined).toBe('InvalidSyncSecretError');
      expect(get(syncSettings).secret).toBe(SECRET);
    });

    it('clears the secret', () => {
      syncSettings.setSecret(SECRET);
      syncSettings.clearSecret();
      expect(get(syncSettings)).toEqual({ deviceName: 'Laptop' });
    });

    it.each([
      ['  Mein Handy  ', 'Mein Handy'],
      ['x'.repeat(50), 'x'.repeat(40)],
      [`${'x'.repeat(39)} y`, 'x'.repeat(39)],
    ])('normalizes the device name %j', (name, expected) => {
      syncSettings.setDeviceName(name);
      expect(get(syncSettings).deviceName).toBe(expected);
    });

    it('falls back to the derived device name for a blank name', () => {
      syncSettings.setDeviceName('   ');
      expect(get(syncSettings).deviceName).toBe(deriveDeviceName(''));
    });
  });
});
