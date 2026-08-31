import { describe, it, expect } from 'vitest';
import { toInteger, toIntegerOrNull, toNumber, toNumberOrNull, toTextOrNull } from './numbers';

describe('konwersja pól formularzy', () => {
  it('converts a numeric string to a number', () => {
    expect(toNumberOrNull('2.5')).toBe(2.5);
    expect(toNumberOrNull(' 10 ')).toBe(10);
  });

  it('accepts a decimal comma', () => {
    expect(toNumberOrNull('2,5')).toBe(2.5);
  });

  it('returns null for an empty or invalid string', () => {
    expect(toNumberOrNull('')).toBeNull();
    expect(toNumberOrNull('   ')).toBeNull();
    expect(toNumberOrNull('abc')).toBeNull();
    expect(toNumberOrNull(null)).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
  });

  it('uses the fallback value', () => {
    expect(toNumber('', 7)).toBe(7);
    expect(toNumber('3', 7)).toBe(3);
  });

  it('truncates to a whole number', () => {
    expect(toIntegerOrNull('2.9')).toBe(2);
    expect(toInteger('abc', 1)).toBe(1);
  });

  it('turns an empty text into null and trims the rest', () => {
    expect(toTextOrNull('  ')).toBeNull();
    expect(toTextOrNull(' 42 ')).toBe('42');
    expect(toTextOrNull(null)).toBeNull();
  });
});
