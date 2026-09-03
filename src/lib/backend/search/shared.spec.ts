import { describe, expect, it } from 'vitest';
import { escapeRegExp } from './shared';

describe('escapeRegExp', () => {
  it('makes an unterminated group or class safe to compile', () => {
    for (const input of ['(', '[', ')', '*', '+', '?', '\\']) {
      expect(() => new RegExp(escapeRegExp(input), 'i')).not.toThrow();
    }
  });

  it('leaves every tag the UI sends unchanged', () => {
    const tags = [
      'Inland',
      'Ausland',
      'Politik',
      'Wirtschaft',
      'Wissenschaft',
      'Technik',
      'Kultur',
      'Gesellschaft',
      'Religion',
      'Sport',
      'Gesundheit',
      'Umwelt',
      'Recht',
      'Help',
    ];
    for (const tag of tags) {
      expect(escapeRegExp(tag)).toBe(tag);
    }
  });

  it('keeps matching unanchored and case-insensitive', () => {
    expect(new RegExp(escapeRegExp('Kultur'), 'i').test('Kultur: Musik')).toBe(true);
    expect(new RegExp(escapeRegExp('Sport'), 'i').test('Motorsport')).toBe(true);
    expect(new RegExp(escapeRegExp('sport'), 'i').test('Sport')).toBe(true);
  });

  it('treats metacharacters as literal text', () => {
    expect(new RegExp(escapeRegExp('.'), 'i').test('abc')).toBe(false);
    expect(new RegExp(escapeRegExp('.'), 'i').test('orf.at')).toBe(true);
    expect(new RegExp(escapeRegExp('a|b'), 'i').test('a')).toBe(false);
    expect(new RegExp(escapeRegExp('a|b'), 'i').test('a|b')).toBe(true);
  });
});
