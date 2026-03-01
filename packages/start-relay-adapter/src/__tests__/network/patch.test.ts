import { MultipartStreamParser } from '#@/fetch/patch-resolver.js';
import { describe, it, expect, vi } from 'vitest';

const encoder = new TextEncoder();
const encode = (s: string) => encoder.encode(s);

describe('MultipartStreamParser', () => {
  const boundary = '----abc123';
  const createDelimitedPart = (json: object) => {
    return (
      `\r\n--${boundary}\r\n` + `Content-Type: application/json\r\n\r\n` + JSON.stringify(json)
    );
  };

  describe('constructor', () => {
    it('initializes with default boundary', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext });
      expect(parser.boundary).toBe('-');
    });

    it('initializes with custom boundary', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary: 'custom' });
      expect(parser.boundary).toBe('custom');
    });
  });

  describe('handleChunk', () => {
    it('accumulates chunks in buffer', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      parser.handleChunk(encode('partial'));
      parser.handleChunk(encode(' data'));

      // No complete part yet, so onNext should not have been called
      expect(onNext).not.toHaveBeenCalled();
    });

    it('parses complete parts and calls onNext', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      const part = createDelimitedPart({ data: { test: true } });
      const closing = `\r\n--${boundary}--`;

      parser.handleChunk(encode(part + closing));

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith([{ data: { test: true } }]);
    });

    it('handles multiple parts in single chunk', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      const part1 = createDelimitedPart({ count: 1 });
      const part2 = createDelimitedPart({ count: 2 });
      const closing = `\r\n--${boundary}--`;

      parser.handleChunk(encode(part1 + part2 + closing));

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith([{ count: 1 }, { count: 2 }]);
    });

    it('handles parts split across chunks', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      const fullPart = createDelimitedPart({ split: true });
      const closing = `\r\n--${boundary}--`;
      const full = fullPart + closing;

      // Split in the middle
      const mid = Math.floor(full.length / 2);
      parser.handleChunk(encode(full.substring(0, mid)));
      parser.handleChunk(encode(full.substring(mid)));

      expect(onNext).toHaveBeenCalledWith([{ split: true }]);
    });

    it('does not call onNext for incomplete data', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      const incompletePart = `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n{"incomplete`;

      parser.handleChunk(encode(incompletePart));

      expect(onNext).not.toHaveBeenCalled();
    });

    it('handles preamble content before first boundary', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      const preamble = 'This is preamble content that should be ignored';
      const part = createDelimitedPart({ afterPreamble: true });
      const closing = `\r\n--${boundary}--`;

      parser.handleChunk(encode(preamble + part + closing));

      expect(onNext).toHaveBeenCalledWith([{ afterPreamble: true }]);
    });

    it('passes through incremental delivery payloads as raw JSON (no transformation)', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      const initial = createDelimitedPart({
        data: { user: { id: '1' } },
        hasNext: true,
        pending: [{ id: '0', path: ['user'], label: 'UserQuery$defer$fragment' }]
      });

      const subsequent = createDelimitedPart({
        incremental: [{ id: '0', data: { name: 'Alice' } }],
        completed: [{ id: '0' }],
        hasNext: false
      });

      const closing = `\r\n--${boundary}--`;

      parser.handleChunk(encode(initial + subsequent + closing));

      expect(onNext).toHaveBeenCalledTimes(1);
      // Raw JSON passthrough — no transformation to Relay format
      expect(onNext).toHaveBeenCalledWith([
        {
          data: { user: { id: '1' } },
          hasNext: true,
          pending: [{ id: '0', path: ['user'], label: 'UserQuery$defer$fragment' }]
        },
        {
          incremental: [{ id: '0', data: { name: 'Alice' } }],
          completed: [{ id: '0' }],
          hasNext: false
        }
      ]);
    });

    it('passes through bare completion signals as raw JSON', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      const bare = createDelimitedPart({ hasNext: false });
      const closing = `\r\n--${boundary}--`;

      parser.handleChunk(encode(bare + closing));

      // Raw passthrough — bare { hasNext: false } is emitted as-is
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onNext).toHaveBeenCalledWith([{ hasNext: false }]);
    });

    it('passes through completed-only chunks as raw JSON', () => {
      const onNext = vi.fn();
      const parser = new MultipartStreamParser({ onNext, boundary });

      const initial = createDelimitedPart({
        data: { user: { id: '1' } },
        hasNext: true,
        pending: [{ id: '0', path: ['user'], label: 'frag' }]
      });

      // A chunk with only completed and hasNext (no incremental)
      const completedOnly = createDelimitedPart({
        completed: [{ id: '0' }],
        hasNext: false
      });

      const closing = `\r\n--${boundary}--`;

      parser.handleChunk(encode(initial + completedOnly + closing));

      expect(onNext).toHaveBeenCalledTimes(1);
      // Raw passthrough — both parts emitted as-is
      expect(onNext).toHaveBeenCalledWith([
        {
          data: { user: { id: '1' } },
          hasNext: true,
          pending: [{ id: '0', path: ['user'], label: 'frag' }]
        },
        {
          completed: [{ id: '0' }],
          hasNext: false
        }
      ]);
    });
  });
});
