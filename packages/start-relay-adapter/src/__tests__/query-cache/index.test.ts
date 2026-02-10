import { createMockOperationDescriptor, createMockGraphQLResponse } from '../utils/index.js';

import { RelayQuery } from '#@/cache/relay-query.js';
import { QueryCache, createQueryCache } from '#@/query-cache.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('QueryCache', () => {
  let originalDateNow: typeof Date.now;

  beforeEach(() => {
    originalDateNow = Date.now;
    Date.now = vi.fn(() => 1700000000000);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('createQueryCache', () => {
    it('creates a QueryCache instance', () => {
      const cache = createQueryCache();
      expect(cache).toBeInstanceOf(QueryCache);
    });

    it('creates a server-side cache when isServer is true', () => {
      const cache = createQueryCache(true);
      expect(cache._isServer).toBe(true);
    });

    it('creates a client-side cache when isServer is false', () => {
      const cache = createQueryCache(false);
      expect(cache._isServer).toBe(false);
    });
  });

  describe('build', () => {
    it('creates a new RelayQuery for a new operation', () => {
      const cache = createQueryCache();
      const operation = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: { id: '1' }
      });

      const query = cache.build(operation);

      expect(query).toBeInstanceOf(RelayQuery);
      expect(query.queryKey).toBe('TestQuery:{"id":"1"}');
    });

    it('returns existing query if operation already cached', () => {
      const cache = createQueryCache();
      const operation = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: { id: '1' }
      });

      const query1 = cache.build(operation);
      const query2 = cache.build(operation);

      expect(query1).toBe(query2);
    });

    it('creates different queries for different variables', () => {
      const cache = createQueryCache();
      const operation1 = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: { id: '1' }
      });
      const operation2 = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: { id: '2' }
      });

      const query1 = cache.build(operation1);
      const query2 = cache.build(operation2);

      expect(query1).not.toBe(query2);
    });

    it('stores the query in the queries map', () => {
      const cache = createQueryCache();
      const operation = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: {}
      });

      const query = cache.build(operation);

      expect(cache.queries.has(query.queryKey)).toBe(true);
      expect(cache.queries.get(query.queryKey)).toBe(query);
    });
  });

  describe('get', () => {
    it('returns undefined for non-existent query', () => {
      const cache = createQueryCache();
      expect(cache.get('non-existent-query')).toBeUndefined();
    });

    it('returns the query for an existing query key', () => {
      const cache = createQueryCache();
      const operation = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: {}
      });

      const query = cache.build(operation);
      const retrieved = cache.get(query.queryKey);

      expect(retrieved).toBe(query);
    });
  });

  describe('onQueryStarted (client-side)', () => {
    it('throws error when called on server', () => {
      const cache = createQueryCache(true);
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });

      expect(() =>
        cache.onQueryStarted({
          type: 'started',
          id: 'TestQuery:{}',
          operation
        })
      ).toThrow('onQueryStarted should not be called on the server');
    });

    it('creates/gets a query and stores it for simulated streaming', () => {
      const cache = createQueryCache(false);
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const queryId = 'TestQuery:{}';

      cache.onQueryStarted({
        type: 'started',
        id: queryId,
        operation
      });

      // The query should be retrievable
      expect(cache.get(queryId)).toBeDefined();
    });
  });

  describe('onQueryProgress (client-side)', () => {
    it('throws error when called on server', () => {
      const cache = createQueryCache(true);

      expect(() =>
        cache.onQueryProgress({
          type: 'complete',
          id: 'test'
        })
      ).toThrow('onQueryProgress should not be called on the server');
    });

    it('throws error when query not found', () => {
      const cache = createQueryCache(false);

      expect(() =>
        cache.onQueryProgress({
          type: 'complete',
          id: 'non-existent'
        })
      ).toThrow('RelayQuery with id non-existent not found');
    });

    it('forwards next events to the query', () => {
      const cache = createQueryCache(false);
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const queryId = 'TestQuery:{}';

      cache.onQueryStarted({ type: 'started', id: queryId, operation });

      const mockNext = vi.fn();
      cache.get(queryId)!.subscribe({ next: mockNext });

      const response = createMockGraphQLResponse({ user: { id: '1' } });
      cache.onQueryProgress({ type: 'next', id: queryId, data: response });

      expect(mockNext).toHaveBeenCalledWith({
        type: 'next',
        id: queryId,
        data: response
      });
    });

    it('forwards complete events and removes from simulated queries', () => {
      const cache = createQueryCache(false);
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const queryId = 'TestQuery:{}';

      cache.onQueryStarted({ type: 'started', id: queryId, operation });

      const mockComplete = vi.fn();
      cache.get(queryId)!.subscribe({ complete: mockComplete });

      cache.onQueryProgress({ type: 'complete', id: queryId });

      expect(mockComplete).toHaveBeenCalled();
    });

    it('forwards error events and removes from simulated queries', () => {
      const cache = createQueryCache(false);
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const queryId = 'TestQuery:{}';

      cache.onQueryStarted({ type: 'started', id: queryId, operation });

      const mockError = vi.fn();
      cache.get(queryId)!.subscribe({ error: mockError });

      cache.onQueryProgress({
        type: 'error',
        id: queryId,
        error: 'test error'
      });

      expect(mockError).toHaveBeenCalled();
    });
  });

  describe('watchQuery (server-side)', () => {
    it('pushes query started event to watch queue', () => {
      const cache = createQueryCache(true);
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const query = cache.build(operation);

      const events: Array<{ event: any; query: RelayQuery }> = [];
      cache.watchQueryQueue.register((item) => events.push(item));

      cache.watchQuery(query);

      expect(events).toHaveLength(1);
      expect(events[0].event.type).toBe('started');
      expect(events[0].event.id).toBe(query.queryKey);
      expect(events[0].query).toBe(query);
    });
  });

  describe('watchQueryQueue backpressure', () => {
    it('queues events when no callback registered', () => {
      const cache = createQueryCache(true);
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const query = cache.build(operation);

      // Push before registering callback
      cache.watchQuery(query);

      // Register callback - should receive queued event
      const events: Array<{ event: any; query: RelayQuery }> = [];
      cache.watchQueryQueue.register((item) => events.push(item));

      expect(events).toHaveLength(1);
    });

    it('drains queue when callback is registered', () => {
      const cache = createQueryCache(true);
      const operation1 = createMockOperationDescriptor({
        id: 'Query1',
        variables: {}
      });
      const operation2 = createMockOperationDescriptor({
        id: 'Query2',
        variables: {}
      });

      const query1 = cache.build(operation1);
      const query2 = cache.build(operation2);

      cache.watchQuery(query1);
      cache.watchQuery(query2);

      const events: Array<{ event: any; query: RelayQuery }> = [];
      cache.watchQueryQueue.register((item) => events.push(item));

      expect(events).toHaveLength(2);
      expect(events[0].event.id).toBe(query1.queryKey);
      expect(events[1].event.id).toBe(query2.queryKey);
    });
  });
});
