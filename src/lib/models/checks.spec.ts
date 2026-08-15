import { Schema } from 'effect';
import { describe, expect, test } from 'vitest';
import { isIsoDateTime, isUrl } from './checks';

const isValidUrl = Schema.is(Schema.String.check(isUrl));
const isValidIsoDateTime = Schema.is(Schema.String.check(isIsoDateTime));

describe('checks', () => {
  describe('isUrl', () => {
    test.each([
      'https://orf.at/stories/1234567',
      'https://orf.at/stories/1234567?query=value#fragment',
      'http://localhost:3000',
      'mongodb://localhost',
    ])('accepts %s', (value) => {
      expect(isValidUrl(value)).toBe(true);
    });

    test.each(['', 'orf.at/stories/1234567', 'not a url'])('rejects %s', (value) => {
      expect(isValidUrl(value)).toBe(false);
    });
  });

  describe('isIsoDateTime', () => {
    test.each([
      ['2026-08-15T10:20:30.123Z', 'toISOString() output'],
      ['2026-08-15T00:00:00.000+02:00', 'Luxon toISO() output'],
      ['2026-08-15T10:20+02:00', 'seconds are optional'],
      ['2026-08-15T10:20:30-05:00', 'negative offset'],
      ['2024-02-29T10:20:30Z', 'leap year'],
      ['2000-02-29T00:00:00Z', 'leap year'],
    ])('accepts %s (%s)', (value) => {
      expect(isValidIsoDateTime(value)).toBe(true);
    });

    test.each([
      ['2026-02-29T10:20:30Z', 'non-leap year'],
      ['1900-02-29T00:00:00Z', 'non-leap year'],
      ['2026-02-30T10:20:30Z', 'day out of range for the month'],
      ['2026-13-01T10:20:30Z', 'month out of range'],
      ['2026-08-15T25:00:00Z', 'hour out of range'],
      ['2026-08-15T10:20:30+99:00', 'offset out of range'],
      ['2026-08-15T10:20:30', 'offset is mandatory'],
      ['2026-08-15', 'date only'],
    ])('rejects %s (%s)', (value) => {
      expect(isValidIsoDateTime(value)).toBe(false);
    });
  });
});
