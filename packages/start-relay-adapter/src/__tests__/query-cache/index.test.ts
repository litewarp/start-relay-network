import { createMockOperationDescriptor, createMockGraphQLResponse } from '../utils/index.js';

import { QueryRecord } from '#@/cache/relay-query.js';
import { QueryRegistry, createQueryRegistry } from '#@/query-cache.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('QueryRegistry', () => {
  let originalDateNow: typeof Date.now;

  beforeEach(() => {
    originalDateNow = Date.now;
    Date.now = vi.fn(() => 1700000000000);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('createQueryRegistry', () => {
    it('creates a QueryRegistry instance', () => {
      const registry = createQueryRegistry();
      expect(registry).toBeInstanceOf(QueryRegistry);
    });

    it('creates a server-side registry when isServer is true', () => {
      const registry = createQueryRegistry({ isServer: true });
      expect(registry._isServer).toBe(true);
    });

    it('creates a client-side registry when isServer is false', () => {
      const registry = createQueryRegistry({ isServer: false });
      expect(registry._isServer).toBe(false);
    });
  });

  describe('build', () => {
    it('creates a new QueryRecord for a new operation', () => {
      const registry = createQueryRegistry();
      const operation = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: { id: '1' }
      });

      const query = registry.build(operation);

      expect(query).toBeInstanceOf(QueryRecord);
      expect(query.queryKey).toBe('TestQuery:{"id":"1"}');
    });

    it('returns existing query if operation already cached', () => {
      const registry = createQueryRegistry();
      const operation = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: { id: '1' }
      });

      const query1 = registry.build(operation);
      const query2 = registry.build(operation);

      expect(query1).toBe(query2);
    });

    it('creates different queries for different variables', () => {
      const registry = createQueryRegistry();
      const operation1 = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: { id: '1' }
      });
      const operation2 = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: { id: '2' }
      });

      const query1 = registry.build(operation1);
      const query2 = registry.build(operation2);

      expect(query1).not.toBe(query2);
    });

    it('stores the query in the queries map', () => {
      const registry = createQueryRegistry();
      const operation = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: {}
      });

      const query = registry.build(operation);

      expect(registry.queries.has(query.queryKey)).toBe(true);
      expect(registry.queries.get(query.queryKey)).toBe(query);
    });
  });

  describe('get', () => {
    it('returns undefined for non-existent query', () => {
      const registry = createQueryRegistry();
      expect(registry.get('non-existent-query')).toBeUndefined();
    });

    it('returns the query for an existing query key', () => {
      const registry = createQueryRegistry();
      const operation = createMockOperationDescriptor({
        id: 'TestQuery',
        variables: {}
      });

      const query = registry.build(operation);
      const retrieved = registry.get(query.queryKey);

      expect(retrieved).toBe(query);
    });
  });

  describe('onQueryStarted (client-side)', () => {
    it('throws error when called on server', () => {
      const registry = createQueryRegistry({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });

      expect(() =>
        registry.onQueryStarted({
          type: 'started',
          id: 'TestQuery:{}',
          operation
        })
      ).toThrow('onQueryStarted should not be called on the server');
    });

    it('creates/gets a query and stores it for simulated streaming', () => {
      const registry = createQueryRegistry({ isServer: false });
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const queryId = 'TestQuery:{}';

      registry.onQueryStarted({
        type: 'started',
        id: queryId,
        operation
      });

      // The query should be retrievable
      expect(registry.get(queryId)).toBeDefined();
    });
  });

  describe('onQueryProgress (client-side)', () => {
    it('throws error when called on server', () => {
      const registry = createQueryRegistry({ isServer: true });

      expect(() =>
        registry.onQueryProgress({
          type: 'complete',
          id: 'test'
        })
      ).toThrow('onQueryProgress should not be called on the server');
    });

    it('throws error when query not found', () => {
      const registry = createQueryRegistry({ isServer: false });

      expect(() =>
        registry.onQueryProgress({
          type: 'complete',
          id: 'non-existent'
        })
      ).toThrow('QueryRecord with id non-existent not found');
    });

    it('forwards next events to the query', () => {
      const registry = createQueryRegistry({ isServer: false });
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const queryId = 'TestQuery:{}';

      registry.onQueryStarted({ type: 'started', id: queryId, operation });

      const mockNext = vi.fn();
      registry.get(queryId)!.subscribe({ next: mockNext });

      const response = createMockGraphQLResponse({ user: { id: '1' } });
      registry.onQueryProgress({ type: 'next', id: queryId, data: response });

      expect(mockNext).toHaveBeenCalledWith({
        type: 'next',
        id: queryId,
        data: response
      });
    });

    it('forwards complete events and removes from simulated queries', () => {
      const registry = createQueryRegistry({ isServer: false });
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const queryId = 'TestQuery:{}';

      registry.onQueryStarted({ type: 'started', id: queryId, operation });

      const mockComplete = vi.fn();
      registry.get(queryId)!.subscribe({ complete: mockComplete });

      registry.onQueryProgress({ type: 'complete', id: queryId });

      expect(mockComplete).toHaveBeenCalled();
    });

    it('forwards error events and removes from simulated queries', () => {
      const registry = createQueryRegistry({ isServer: false });
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const queryId = 'TestQuery:{}';

      registry.onQueryStarted({ type: 'started', id: queryId, operation });

      const mockError = vi.fn();
      registry.get(queryId)!.subscribe({ error: mockError });

      registry.onQueryProgress({
        type: 'error',
        id: queryId,
        error: 'test error'
      });

      expect(mockError).toHaveBeenCalled();
    });
  });

  describe('watchQuery (server-side)', () => {
    it('pushes query started event to subscribeToQueries observer', () => {
      const registry = createQueryRegistry({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const query = registry.build(operation);

      const events: Array<{ event: any; query: QueryRecord }> = [];
      registry.subscribeToQueries({ next: (item) => events.push(item) });

      registry.watchQuery(query);

      expect(events).toHaveLength(1);
      expect(events[0].event.type).toBe('started');
      expect(events[0].event.id).toBe(query.queryKey);
      expect(events[0].query).toBe(query);
    });
  });

  describe('subscribeToQueries (ReplaySubject)', () => {
    it('replays events to late subscribers', () => {
      const registry = createQueryRegistry({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const query = registry.build(operation);

      // Push before subscribing
      registry.watchQuery(query);

      // Subscribe - should receive replayed event
      const events: Array<{ event: any; query: QueryRecord }> = [];
      registry.subscribeToQueries({ next: (item) => events.push(item) });

      expect(events).toHaveLength(1);
    });

    it('replays multiple events to late subscribers', () => {
      const registry = createQueryRegistry({ isServer: true });
      const operation1 = createMockOperationDescriptor({
        id: 'Query1',
        variables: {}
      });
      const operation2 = createMockOperationDescriptor({
        id: 'Query2',
        variables: {}
      });

      const query1 = registry.build(operation1);
      const query2 = registry.build(operation2);

      registry.watchQuery(query1);
      registry.watchQuery(query2);

      const events: Array<{ event: any; query: QueryRecord }> = [];
      registry.subscribeToQueries({ next: (item) => events.push(item) });

      expect(events).toHaveLength(2);
      expect(events[0].event.id).toBe(query1.queryKey);
      expect(events[1].event.id).toBe(query2.queryKey);
    });
  });
});
