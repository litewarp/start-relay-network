import {
  getDelimiter,
  getClosingDelimiter,
  removeQuotes,
  splitWithRest,
  getBoundary,
  parseMultipartHttp
} from '#@/fetch/multipart-utils.js';
import { describe, it, expect } from 'vitest';

describe('multipart-utils', () => {
  describe('getDelimiter', () => {
    it('returns CRLF-prefixed boundary', () => {
      expect(getDelimiter('abc123')).toBe('\r\n--abc123');
    });

    it('handles boundary with dashes', () => {
      expect(getDelimiter('----boundary')).toBe('\r\n------boundary');
    });
  });

  describe('getClosingDelimiter', () => {
    it('returns CRLF-prefixed boundary with trailing dashes', () => {
      expect(getClosingDelimiter('abc123')).toBe('\r\n--abc123--');
    });

    it('handles boundary with dashes', () => {
      expect(getClosingDelimiter('----boundary')).toBe('\r\n------boundary--');
    });
  });

  describe('removeQuotes', () => {
    it('removes surrounding quotes', () => {
      expect(removeQuotes('"value"')).toBe('value');
    });

    it('leaves unquoted strings unchanged', () => {
      expect(removeQuotes('value')).toBe('value');
    });

    it('handles empty quoted string', () => {
      expect(removeQuotes('""')).toBe('');
    });

    it('only removes surrounding quotes, not internal', () => {
      expect(removeQuotes('"hello"world"')).toBe('hello"world');
    });
  });

  describe('splitWithRest', () => {
    it('splits string at delimiter', () => {
      const [before, after] = splitWithRest('hello:world', ':');
      expect(before).toBe('hello');
      expect(after).toBe('world');
    });

    it('returns undefined and original string when delimiter not found', () => {
      const [before, after] = splitWithRest('hello world', ':');
      expect(before).toBeUndefined();
      expect(after).toBe('hello world');
    });

    it('handles delimiter at start', () => {
      const [before, after] = splitWithRest(':rest', ':');
      expect(before).toBe('');
      expect(after).toBe('rest');
    });

    it('handles delimiter at end', () => {
      const [before, after] = splitWithRest('start:', ':');
      expect(before).toBe('start');
      expect(after).toBe('');
    });

    it('only splits at first occurrence', () => {
      const [before, after] = splitWithRest('a:b:c', ':');
      expect(before).toBe('a');
      expect(after).toBe('b:c');
    });

    it('handles multi-character delimiters', () => {
      const [before, after] = splitWithRest('hello\r\n\r\nworld', '\r\n\r\n');
      expect(before).toBe('hello');
      expect(after).toBe('world');
    });
  });

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
  });

  describe('parseMultipartHttp', () => {
    const boundary = '----abc123';
    const delimiter = `\r\n--${boundary}`;
    const closingDelimiter = `\r\n--${boundary}--`;

    it('parses single part response', () => {
      const body = JSON.stringify({ data: { user: { id: '1' } } });
      const buffer = `${delimiter}\r\nContent-Type: application/json\r\n\r\n${body}${closingDelimiter}`;

      const result = parseMultipartHttp(buffer, boundary);

      expect(result.parts).toHaveLength(1);
      expect(result.parts[0]).toEqual({ data: { user: { id: '1' } } });
      // After closing delimiter, buffer contains trailing '--' from the boundary parsing
      expect(result.isPreamble).toBe(false);
    });

    it('parses multiple parts', () => {
      const part1 = JSON.stringify({ data: { count: 1 }, hasNext: true });
      const part2 = JSON.stringify({
        incremental: [{ data: { name: 'test' } }],
        hasNext: false
      });

      const buffer =
        `${delimiter}\r\nContent-Type: application/json\r\n\r\n${part1}` +
        `${delimiter}\r\nContent-Type: application/json\r\n\r\n${part2}${closingDelimiter}`;

      const result = parseMultipartHttp(buffer, boundary);

      expect(result.parts).toHaveLength(2);
      expect(result.parts[0]).toEqual({ data: { count: 1 }, hasNext: true });
      expect(result.parts[1]).toEqual({
        incremental: [{ data: { name: 'test' } }],
        hasNext: false
      });
    });

    it('handles incomplete buffer (waiting for more data)', () => {
      const partialBody = '{"data": {"user"';
      const buffer = `${delimiter}\r\nContent-Type: application/json\r\n\r\n${partialBody}`;

      const result = parseMultipartHttp(buffer, boundary, [], false);

      expect(result.parts).toHaveLength(0);
      // The parser keeps the buffer without the already-consumed delimiter
      expect(result.newBuffer).toContain(partialBody);
    });

    it('handles preamble content before first boundary', () => {
      const body = JSON.stringify({ data: {} });
      const buffer = `Some preamble text${delimiter}\r\nContent-Type: application/json\r\n\r\n${body}${closingDelimiter}`;

      const result = parseMultipartHttp(buffer, boundary);

      expect(result.parts).toHaveLength(1);
      expect(result.isPreamble).toBe(false);
    });

    it('accumulates parts with previousParts parameter', () => {
      const existingParts = [{ data: { existing: true } }];
      const body = JSON.stringify({ data: { new: true } });
      const buffer = `${delimiter}\r\nContent-Type: application/json\r\n\r\n${body}${closingDelimiter}`;

      const result = parseMultipartHttp(
        buffer,
        boundary,
        existingParts,
        false // not preamble
      );

      expect(result.parts).toHaveLength(2);
      expect(result.parts[0]).toEqual({ data: { existing: true } });
      expect(result.parts[1]).toEqual({ data: { new: true } });
    });

    it('handles empty preamble', () => {
      const body = JSON.stringify({ test: true });
      const buffer = `${delimiter}\r\nContent-Type: application/json\r\n\r\n${body}${closingDelimiter}`;

      const result = parseMultipartHttp(buffer, boundary, [], true);

      expect(result.parts).toHaveLength(1);
      expect(result.isPreamble).toBe(false);
    });

    it('returns empty parts for incomplete data', () => {
      const buffer = `Some data without complete boundary`;

      const result = parseMultipartHttp(buffer, boundary);

      expect(result.parts).toHaveLength(0);
      expect(result.newBuffer).toBe(buffer);
    });
  });
});
