import { getBoundary } from '#@/fetch/multipart-utils.js';
import { describe, it, expect } from 'vitest';

describe('getBoundary', () => {
  it('extracts boundary from content-type header', () => {
    expect(getBoundary('multipart/mixed; boundary=----abc123')).toBe('----abc123');
  });

  it('handles quoted boundary values', () => {
    expect(getBoundary('multipart/mixed; boundary="----abc123"')).toBe('----abc123');
  });

  it('returns default when no boundary present', () => {
    expect(getBoundary('application/json')).toBe('-');
  });

  it('returns default for empty string', () => {
    expect(getBoundary('')).toBe('-');
  });

  it('returns default for undefined', () => {
    expect(getBoundary()).toBe('-');
  });

  it('handles multiple parameters', () => {
    expect(getBoundary('multipart/mixed; charset=utf-8; boundary=---xyz')).toBe('---xyz');
  });

  it('handles boundary as first parameter', () => {
    expect(getBoundary('boundary=abc; multipart/mixed')).toBe('abc');
  });
});
