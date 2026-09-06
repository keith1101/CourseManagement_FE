import { describe, it, expect } from 'vitest';
import { formatDate } from '../date';

describe('formatDate utility', () => {
  it('formats dates with single digit day and month to dd/MM/yyyy with leading zeros', () => {
    // 2027-09-01 -> 01/09/2027
    expect(formatDate('2027-09-01T00:00:00+07:00')).toBe('01/09/2027');
    // Date with single digit day: 2026-11-06 -> 06/11/2026
    expect(formatDate('2026-11-06T00:00:00+07:00')).toBe('06/11/2026');
    // Date with single digit month: 2027-01-15 -> 15/01/2027
    expect(formatDate('2027-01-15T00:00:00+07:00')).toBe('15/01/2027');
  });

  it('preserves two digit day and month as dd/MM/yyyy', () => {
    // 2027-12-25 -> 25/12/2027
    expect(formatDate('2027-12-25T00:00:00+07:00')).toBe('25/12/2027');
    expect(formatDate('2026-10-20T00:00:00+07:00')).toBe('20/10/2026');
  });

  it('handles Date instances and numeric timestamps', () => {
    const d = new Date(Date.UTC(2027, 8, 1, 0, 0, 0)); // 2027-09-01 00:00:00 UTC = 07:00:00 +07:00
    expect(formatDate(d)).toBe('01/09/2027');
    expect(formatDate(d.getTime())).toBe('01/09/2027');
  });

  it('handles null, undefined, and empty string without throwing', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('   ')).toBe('');
  });

  it('returns fallback string when provided for null/undefined/empty', () => {
    expect(formatDate(null, '-')).toBe('-');
    expect(formatDate(undefined, 'N/A')).toBe('N/A');
    expect(formatDate('', { fallback: 'Không có' })).toBe('Không có');
  });

  it('does NOT display "Invalid Date" for invalid date inputs', () => {
    expect(formatDate('invalid-date-string')).toBe('');
    expect(formatDate('2027-99-99')).toBe('');
    expect(formatDate('abc', '-')).toBe('-');
    expect(formatDate('not a date', { fallback: 'Chưa xác định' })).toBe('Chưa xác định');
  });
});
