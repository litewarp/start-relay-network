import { transformToRelayResponse, grafastRelayTransform } from '#@/middleware/grafast-relay.js';
import { describe, it, expect } from 'vitest';

describe('transformToRelayResponse', () => {
  describe('non-streaming ExecutionResult', () => {
    it('transforms a simple result with is_final: true', () => {
      const transformed = transformToRelayResponse({
        data: { user: { id: '1', name: 'Alice' } }
      });

      expect(transformed).toEqual({
        data: { user: { id: '1', name: 'Alice' } },
        extensions: { is_final: true }
      });
    });

    it('preserves errors', () => {
      const transformed = transformToRelayResponse({
        data: null,
        errors: [
          { message: 'Something went wrong', locations: [{ line: 1, column: 1 }] }
        ]
      });

      expect(transformed).toEqual({
        data: null,
        errors: [
          { message: 'Something went wrong', locations: [{ line: 1, column: 1 }] }
        ],
        extensions: { is_final: true }
      });
    });

    it('preserves existing extensions and adds is_final', () => {
      const transformed = transformToRelayResponse({
        data: { test: true },
        extensions: { tracing: { duration: 100 } }
      });

      expect(transformed).toEqual({
        data: { test: true },
        extensions: { tracing: { duration: 100 }, is_final: true }
      });
    });

    it('handles null data', () => {
      const transformed = transformToRelayResponse({ data: null });

      expect(transformed).toEqual({
        data: null,
        extensions: { is_final: true }
      });
    });
  });

  describe('streaming ExecutionPatchResult with hasNext: true', () => {
    it('transforms a patch with is_final: false', () => {
      const transformed = transformToRelayResponse({
        data: { name: 'Alice' },
        path: ['user'],
        label: 'UserDetails',
        hasNext: true
      });

      expect(transformed).toEqual({
        data: { name: 'Alice' },
        path: ['user'],
        label: 'UserDetails',
        extensions: { is_final: false }
      });
    });

    it('preserves errors in patch results', () => {
      const transformed = transformToRelayResponse({
        data: null,
        path: ['user'],
        errors: [{ message: 'Field error' }],
        hasNext: true
      });

      expect(transformed).toEqual({
        data: null,
        path: ['user'],
        errors: [{ message: 'Field error' }],
        extensions: { is_final: false }
      });
    });

    it('preserves existing extensions in patches', () => {
      const transformed = transformToRelayResponse({
        data: { value: 42 },
        path: ['items', 0],
        hasNext: true,
        extensions: { custom: 'data' }
      });

      expect(transformed).toEqual({
        data: { value: 42 },
        path: ['items', 0],
        extensions: { custom: 'data', is_final: false }
      });
    });
  });

  describe('streaming ExecutionPatchResult with hasNext: false', () => {
    it('transforms the final patch with is_final: true', () => {
      const transformed = transformToRelayResponse({
        data: { email: 'alice@example.com' },
        path: ['user'],
        label: 'UserEmail',
        hasNext: false
      });

      expect(transformed).toEqual({
        data: { email: 'alice@example.com' },
        path: ['user'],
        label: 'UserEmail',
        extensions: { is_final: true }
      });
    });
  });

  describe('edge cases', () => {
    it('does not include path/label when not present in patch', () => {
      const transformed = transformToRelayResponse({
        data: { count: 5 },
        hasNext: true
      });

      expect(transformed).not.toHaveProperty('path');
      expect(transformed).not.toHaveProperty('label');
      expect(transformed).toEqual({
        data: { count: 5 },
        extensions: { is_final: false }
      });
    });

    it('does not include errors when not present', () => {
      const transformed = transformToRelayResponse({
        data: { ok: true }
      });

      expect(transformed).not.toHaveProperty('errors');
    });

    it('strips hasNext from the output', () => {
      const transformed = transformToRelayResponse({
        data: { value: 1 },
        path: ['a'],
        hasNext: true
      });

      expect(transformed).not.toHaveProperty('hasNext');
    });
  });
});

describe('grafastRelayTransform', () => {
  it('returns a factory that wraps transformToRelayResponse', () => {
    const transform = grafastRelayTransform();

    const result = transform({
      data: { user: { id: '1' } }
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      data: { user: { id: '1' } },
      extensions: { is_final: true }
    });
  });

  it('transforms streaming patches', () => {
    const transform = grafastRelayTransform();

    const result = transform({
      data: { name: 'Alice' },
      path: ['user'],
      hasNext: true
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      data: { name: 'Alice' },
      path: ['user'],
      extensions: { is_final: false }
    });
  });
});
