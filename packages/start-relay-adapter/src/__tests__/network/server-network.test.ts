import { ServerRelayNetwork } from '#@/network/server.js';
import { QueryCache } from '#@/query-cache.js';
import {
  createMockRequestParameters,
  createMultipartResponse,
  createMockStream,
  createMockOperationDescriptor
} from '../utils/relay-mocks.js';
import type { GraphQLResponse } from 'relay-runtime';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Creates a mock fetch Response for multipart/mixed content.
 */
function mockMultipartFetchResponse(parts: object[], boundary = '----abc123') {
  const responseBody = createMultipartResponse(parts, boundary);
  const encoder = new TextEncoder();
  const stream = createMockStream([encoder.encode(responseBody)]);
  return {
    status: 200,
    headers: new Headers({
      'Content-Type': `multipart/mixed; boundary=${boundary}`
    }),
    body: stream,
    json: vi.fn().mockResolvedValue({})
  };
}


/**
 * Subscribes to a Relay Observable and collects all emissions.
 */
function subscribeAndCollect(observable: ReturnType<ServerRelayNetwork['execute']>) {
  return new Promise<{
    values: GraphQLResponse[];
    error: Error | null;
    completed: boolean;
  }>((resolve) => {
    const result = {
      values: [] as GraphQLResponse[],
      error: null as Error | null,
      completed: false
    };
    const timeout = setTimeout(() => resolve(result), 2000);

    observable.subscribe({
      next: (val: GraphQLResponse) => result.values.push(val),
      error: (err: Error) => {
        result.error = err;
        clearTimeout(timeout);
        resolve(result);
      },
      complete: () => {
        result.completed = true;
        clearTimeout(timeout);
        resolve(result);
      }
    });
  });
}

describe('ServerRelayNetwork', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function createServerNetwork(queryCache: QueryCache) {
    return new ServerRelayNetwork({
      url: 'http://test.com/graphql',
      getFetchOptions: async () => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' })
      }),
      queryCache
    });
  }

  describe('cache-hit pipeline (multipartFetch → query → Observable)', () => {
    it('forwards multipart @stream parts through query.next to Observable sink', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'stream-server' });
      queryCache.build(operation);

      const parts = [
        {
          data: { allUsersList: [] },
          hasNext: true,
          pending: [{ id: '0', path: ['allUsersList'], label: 'users' }]
        },
        {
          incremental: [{ id: '0', items: [{ id: 1, name: 'Alice' }] }],
          completed: [],
          hasNext: true
        },
        {
          incremental: [{ id: '0', items: [{ id: 2, name: 'Bob' }] }],
          completed: [{ id: '0' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'stream-server' });
      const observable = network.execute(request, {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(3);
      expect(values[0]).toEqual(parts[0]);
      expect(values[1]).toEqual(parts[1]);
      expect(values[2]).toEqual(parts[2]);
      expect(completed).toBe(true);
    });

    it('forwards multipart @defer parts through query.next to Observable sink', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'defer-server' });
      queryCache.build(operation);

      const parts = [
        {
          data: { userById: { id: 1 } },
          hasNext: true,
          pending: [{ id: '0', path: ['userById'], label: 'details' }]
        },
        {
          incremental: [{ id: '0', data: { name: 'Alice', email: 'alice@example.com' } }],
          completed: [{ id: '0' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'defer-server' });
      const observable = network.execute(request, {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(2);
      expect(values[0]).toEqual(
        expect.objectContaining({ data: { userById: { id: 1 } }, hasNext: true })
      );
      expect(values[1]).toEqual(
        expect.objectContaining({
          incremental: [{ id: '0', data: { name: 'Alice', email: 'alice@example.com' } }],
          hasNext: false
        })
      );
      expect(completed).toBe(true);
    });

    it('calls watchQuery when query is found in cache', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'watch-query' });
      queryCache.build(operation);

      const watchQuerySpy = vi.spyOn(queryCache, 'watchQuery');

      const parts = [{ data: { test: true }, hasNext: false }];
      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'watch-query' });
      const observable = network.execute(request, {}, {}, null);
      await subscribeAndCollect(observable);

      expect(watchQuerySpy).toHaveBeenCalledTimes(1);
    });

    it('query completion triggers Observable complete', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'complete-server' });
      queryCache.build(operation);

      const parts = [
        {
          data: { userById: { id: 1 } },
          hasNext: true,
          pending: [{ id: '0', path: ['userById'], label: 'details' }]
        },
        {
          incremental: [{ id: '0', data: { name: 'Alice' } }],
          completed: [{ id: '0' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'complete-server' });
      const observable = network.execute(request, {}, {}, null);
      const { completed } = await subscribeAndCollect(observable);

      expect(completed).toBe(true);
    });
  });

  describe('non-preloaded queries (cache miss)', () => {
    it('returns a never-resolving Observable when query is not in cache', async () => {
      const queryCache = new QueryCache({ isServer: true }); // empty cache

      globalThis.fetch = vi.fn();

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'uncached-server-query' });
      const observable = network.execute(request, {}, {}, null);

      const { values, completed, error } = await subscribeAndCollect(observable);

      // Observable should never emit, complete, or error — it stays suspended
      expect(values).toHaveLength(0);
      expect(completed).toBe(false);
      expect(error).toBeNull();
      // No fetch should have been made
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('does not call watchQuery for non-preloaded queries', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const watchQuerySpy = vi.spyOn(queryCache, 'watchQuery');

      globalThis.fetch = vi.fn();

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'unwatched-query' });
      network.execute(request, {}, {}, null);

      expect(watchQuerySpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('pipes multipartFetch rejection to query.error then Observable.error', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'fetch-error-server' });
      queryCache.build(operation);

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'fetch-error-server' });
      const observable = network.execute(request, {}, {}, null);
      const { error } = await subscribeAndCollect(observable);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Network error');
    });

    it('pipes stream error to query.error then Observable.error', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'stream-error-server' });
      queryCache.build(operation);

      let chunkCount = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          chunkCount++;
          if (chunkCount === 1) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('\r\n------abc\r\n'));
          } else {
            controller.error(new Error('Stream error'));
          }
        }
      });

      const mockResponse = {
        status: 200,
        headers: new Headers({
          'Content-Type': 'multipart/mixed; boundary=----abc'
        }),
        body: stream,
        json: vi.fn()
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'stream-error-server' });
      const observable = network.execute(request, {}, {}, null);
      const { error } = await subscribeAndCollect(observable);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Stream error');
    });
  });

  describe('AbortSignal forwarding', () => {
    it('forwards AbortSignal from cacheConfig.metadata to fetch', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'abort-server' });
      queryCache.build(operation);

      const controller = new AbortController();

      const parts = [{ data: { test: true }, hasNext: false }];
      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'abort-server' });
      const cacheConfig = { metadata: { abortSignal: controller.signal } };
      const observable = network.execute(request, {}, cacheConfig, null);
      await subscribeAndCollect(observable);

      // Verify fetch was called with the abort signal
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://test.com/graphql',
        expect.objectContaining({ signal: controller.signal })
      );
    });

    it('does not include signal when cacheConfig has no abortSignal', async () => {
      const queryCache = new QueryCache({ isServer: true });
      const operation = createMockOperationDescriptor({ id: 'no-abort-server' });
      queryCache.build(operation);

      const parts = [{ data: { test: true }, hasNext: false }];
      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createServerNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'no-abort-server' });
      const observable = network.execute(request, {}, {}, null);
      await subscribeAndCollect(observable);

      // Signal should be undefined when not provided
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://test.com/graphql',
        expect.objectContaining({ signal: undefined })
      );
    });
  });
});
