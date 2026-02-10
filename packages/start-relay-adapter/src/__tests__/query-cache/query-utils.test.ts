import { createMockOperationDescriptor } from '../utils/index.js';

import {
  queryKeyFromIdAndVariables,
  buildQueryKey,
  buildUniqueKey,
  parseUniqueKey
} from '#@/cache/query-utils.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('query-utils', () => {
  describe('queryKeyFromIdAndVariables', () => {
    it('creates a key from id and empty variables', () => {
      const key = queryKeyFromIdAndVariables('test-id', {});
      expect(key).toBe('test-id:{}');
    });

    it('creates a key from id and variables', () => {
      const key = queryKeyFromIdAndVariables('my-query', { userId: '123', limit: 10 });
      expect(key).toBe('my-query:{"userId":"123","limit":10}');
    });

    it('serializes nested variables correctly', () => {
      const key = queryKeyFromIdAndVariables('query', {
        filter: { status: 'active', tags: ['a', 'b'] }
      });
      expect(key).toBe('query:{"filter":{"status":"active","tags":["a","b"]}}');
    });

    it('handles null and undefined values in variables', () => {
      const key = queryKeyFromIdAndVariables('query', {
        nullField: null
        // undefined fields are stripped by JSON.stringify
      });
      expect(key).toBe('query:{"nullField":null}');
    });
  });

  describe('buildQueryKey', () => {
    it('builds key using operation.request.node.params.id when available', () => {
      const operation = createMockOperationDescriptor({
        id: 'persisted-query-id',
        variables: { foo: 'bar' }
      });
      const key = buildQueryKey(operation);
      expect(key).toBe('persisted-query-id:{"foo":"bar"}');
    });

    it('falls back to cacheID when id is not available', () => {
      const operation = createMockOperationDescriptor({
        name: 'FallbackQuery',
        variables: { x: 1 }
      });
      // Set id to null so it falls back to cacheID
      Object.defineProperty(operation.request.node.params, 'id', {
        value: null,
        writable: true,
        configurable: true
      });
      Object.defineProperty(operation.request.node.params, 'cacheID', {
        value: 'FallbackQuery',
        writable: true,
        configurable: true
      });
      const key = buildQueryKey(operation);
      expect(key).toBe('FallbackQuery:{"x":1}');
    });

    it('creates consistent keys for same operation', () => {
      const operation1 = createMockOperationDescriptor({
        id: 'same-id',
        variables: { a: 1, b: 2 }
      });
      const operation2 = createMockOperationDescriptor({
        id: 'same-id',
        variables: { a: 1, b: 2 }
      });
      expect(buildQueryKey(operation1)).toBe(buildQueryKey(operation2));
    });

    it('creates different keys for different variables', () => {
      const operation1 = createMockOperationDescriptor({
        id: 'same-id',
        variables: { a: 1 }
      });
      const operation2 = createMockOperationDescriptor({
        id: 'same-id',
        variables: { a: 2 }
      });
      expect(buildQueryKey(operation1)).not.toBe(buildQueryKey(operation2));
    });
  });

  describe('buildUniqueKey', () => {
    let originalDateNow: typeof Date.now;

    beforeEach(() => {
      originalDateNow = Date.now;
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it('appends timestamp to query key', () => {
      Date.now = vi.fn(() => 1700000000000);
      const uniqueKey = buildUniqueKey('my-query:{}');
      expect(uniqueKey).toBe('my-query:{}:1700000000000');
    });

    it('creates different unique keys for same query key at different times', () => {
      Date.now = vi.fn(() => 1700000000000);
      const key1 = buildUniqueKey('query:{}');

      Date.now = vi.fn(() => 1700000000001);
      const key2 = buildUniqueKey('query:{}');

      expect(key1).not.toBe(key2);
    });
  });

  describe('parseUniqueKey', () => {
    it('parses unique key with simple id', () => {
      // Note: the current implementation splits on ':', which means
      // complex query keys with ':' in them will be split incorrectly
      const [queryKey, timestamp] = parseUniqueKey('my-query:1700000000000');
      expect(queryKey).toBe('my-query');
      expect(timestamp).toBe(1700000000000);
    });

    it('handles keys without colons', () => {
      const [queryKey, timestamp] = parseUniqueKey('simplekey');
      expect(queryKey).toBe('simplekey');
      expect(timestamp).toBeNaN();
    });
  });
});
