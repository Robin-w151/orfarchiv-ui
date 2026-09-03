import { describe, expect, it } from 'vitest';
import { normalizeQuery } from './embedding';

describe('normalizeQuery', () => {
  it('capitalizes a single all-lowercase word', () => {
    expect(normalizeQuery('russland')).toBe('Russland');
    expect(normalizeQuery('wald')).toBe('Wald');
  });

  it('capitalizes every token long enough to be a noun', () => {
    expect(normalizeQuery('drohnen raffinerie')).toBe('Drohnen Raffinerie');
    expect(normalizeQuery('pkw unfall')).toBe('Pkw Unfall');
    expect(normalizeQuery('sanktionen gegen russland')).toBe('Sanktionen Gegen Russland');
  });

  it('leaves short lowercase tokens as typed, so acronyms survive', () => {
    expect(normalizeQuery('fussball wm')).toBe('Fussball wm');
    expect(normalizeQuery('eu gipfel')).toBe('Eu Gipfel');
  });

  it('does not upper-case a short lowercase token', () => {
    expect(normalizeQuery('orf')).toBe('Orf');
  });

  it('leaves a short ALL-CAPS token alone, because it reads as an acronym', () => {
    expect(normalizeQuery('ORF')).toBe('ORF');
    expect(normalizeQuery('ÖFB')).toBe('ÖFB');
    expect(normalizeQuery('EU')).toBe('EU');
    expect(normalizeQuery('NATO')).toBe('NATO');
  });

  it('preserves the longest real acronyms in the corpus', () => {
    expect(normalizeQuery('ASFINAG')).toBe('ASFINAG');
    expect(normalizeQuery('STRABAG')).toBe('STRABAG');
    expect(normalizeQuery('UNESCO')).toBe('UNESCO');
    expect(normalizeQuery('ÖAMTC')).toBe('ÖAMTC');
    expect(normalizeQuery('KELAG')).toBe('KELAG');
  });

  it('lowercases a long ALL-CAPS token, because it reads as shouting', () => {
    expect(normalizeQuery('TEUERUNG')).toBe('Teuerung');
    expect(normalizeQuery('HOCHWASSER')).toBe('Hochwasser');
    expect(normalizeQuery('KLIMASCHUTZ')).toBe('Klimaschutz');
  });

  it('decides ALL-CAPS per token, so an acronym survives next to a shouted word', () => {
    expect(normalizeQuery('FUSSBALL WM')).toBe('Fussball WM');
    expect(normalizeQuery('ORF HOCHWASSER')).toBe('ORF hochwasser');
  });

  it('still preserves an all-caps ordinary word in the 6-7 overlap', () => {
    expect(normalizeQuery('WETTER')).toBe('WETTER');
  });

  it('leaves a mixed-case query alone, because the casing is a signal', () => {
    expect(normalizeQuery('Russland')).toBe('Russland');
    expect(normalizeQuery('iPhone')).toBe('iPhone');
    expect(normalizeQuery('ÖBB Streik')).toBe('ÖBB Streik');
  });

  it('handles umlauts as the first letter', () => {
    expect(normalizeQuery('öbb streik')).toBe('Öbb Streik');
  });

  it('collapses surrounding and repeated whitespace', () => {
    expect(normalizeQuery('  ukraine   krieg  ')).toBe('Ukraine Krieg');
  });

  it('is idempotent, so a normalized query keeps the same cache key', () => {
    for (const query of ['russland', 'RUSSLAND', 'ORF', 'FUSSBALL WM', 'drohnen raffinerie', 'iPhone']) {
      expect(normalizeQuery(normalizeQuery(query))).toBe(normalizeQuery(query));
    }
  });

  it('maps queries that differ only in casing onto one cache key', () => {
    expect(new Set(['russland', 'RUSSLAND', 'Russland'].map(normalizeQuery)).size).toBe(1);
  });

  it('leaves a query with no letters untouched', () => {
    expect(normalizeQuery('2024')).toBe('2024');
  });
});
