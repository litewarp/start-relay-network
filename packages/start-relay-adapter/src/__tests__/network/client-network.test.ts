import { ClientRelayNetwork } from '#@/network/client.js';
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
 * All parts are encoded into a single ReadableStream chunk.
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
 * Creates a mock fetch Response for application/json content.
 */
function mockJsonFetchResponse(data: object) {
  return {
    status: 200,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: vi.fn().mockResolvedValue(data),
    body: null
  };
}

/**
 * Subscribes to a Relay Observable and collects all emissions into a result object.
 * Resolves when the Observable completes or errors, or after a timeout.
 */
function subscribeAndCollect(observable: ReturnType<ClientRelayNetwork['execute']>) {
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

describe('ClientRelayNetwork', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function createClientNetwork(queryCache?: QueryCache) {
    return new ClientRelayNetwork({
      url: 'http://test.com/graphql',
      getFetchOptions: async () => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' })
      }),
      queryCache: queryCache ?? new QueryCache()
    });
  }

  describe('@stream via multipart response', () => {
    it('receives streamed list items incrementally and emits each via sink.next()', async () => {
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

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      // Transformer converts 2023 spec → Relay format
      expect(values).toHaveLength(3);
      expect(values[0]).toEqual({ data: { allUsersList: [] }, hasNext: true });
      expect(values[1]).toEqual({
        items: [{ id: 1, name: 'Alice' }],
        path: ['allUsersList'],
        label: 'users',
        hasNext: true
      });
      expect(values[2]).toEqual({
        items: [{ id: 2, name: 'Bob' }],
        path: ['allUsersList'],
        label: 'users',
        hasNext: false
      });
      expect(completed).toBe(true);
    });

    it('handles initialCount:0 - empty initial payload, items arrive in subsequent parts', async () => {
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

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values[0]).toEqual(
        expect.objectContaining({ data: { allUsersList: [] }, hasNext: true })
      );
      expect(values[1]).toEqual(
        expect.objectContaining({
          items: [{ id: 1, name: 'Alice' }],
          path: ['allUsersList'],
          label: 'users'
        })
      );
      expect(values[2]).toEqual(
        expect.objectContaining({
          items: [{ id: 2, name: 'Bob' }],
          path: ['allUsersList'],
          label: 'users',
          hasNext: false
        })
      );
      expect(completed).toBe(true);
    });

    it('handles initialCount:1 - first item in initial payload, rest streamed', async () => {
      const parts = [
        {
          data: { allUsersList: [{ id: 1, name: 'Alice' }] },
          hasNext: true,
          pending: [{ id: '0', path: ['allUsersList'], label: 'users' }]
        },
        {
          incremental: [{ id: '0', items: [{ id: 2, name: 'Bob' }] }],
          completed: [{ id: '0' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(2);
      expect(values[0]).toEqual(
        expect.objectContaining({
          data: { allUsersList: [{ id: 1, name: 'Alice' }] },
          hasNext: true
        })
      );
      expect(values[1]).toEqual(
        expect.objectContaining({
          items: [{ id: 2, name: 'Bob' }],
          path: ['allUsersList'],
          label: 'users',
          hasNext: false
        })
      );
      expect(completed).toBe(true);
    });

    it('final chunk with only hasNext:false triggers sink.complete()', async () => {
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
        { hasNext: false }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      // Bare { hasNext: false } is absorbed by the transformer (no data for Relay),
      // completion comes from the multipart stream ending
      expect(values).toHaveLength(2);
      expect(completed).toBe(true);
    });

    it('handles @stream with if:false - single JSON response, one sink.next then complete', async () => {
      const data = {
        data: {
          allUsersList: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
          ]
        }
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockJsonFetchResponse(data));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(1);
      expect(values[0]).toEqual(data);
      expect(completed).toBe(true);
    });
  });

  describe('@defer via multipart response', () => {
    it('receives deferred fragment data incrementally', async () => {
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

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(2);
      expect(values[0]).toEqual(
        expect.objectContaining({ data: { userById: { id: 1 } }, hasNext: true })
      );
      expect(values[1]).toEqual(
        expect.objectContaining({
          data: { name: 'Alice', email: 'alice@example.com' },
          path: ['userById'],
          label: 'details',
          hasNext: false
        })
      );
      expect(completed).toBe(true);
    });

    it('emits initial payload without deferred fields first, then deferred data', async () => {
      const parts = [
        {
          data: { userById: { id: 1, __typename: 'User' } },
          hasNext: true,
          pending: [{ id: '0', path: ['userById'], label: 'UserDetails' }]
        },
        {
          incremental: [
            { id: '0', data: { name: 'Alice', email: 'alice@example.com', bio: 'Hello' } }
          ],
          completed: [{ id: '0' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      // First emission: initial payload without deferred fields or pending
      expect(values[0]).toEqual(
        expect.objectContaining({
          data: { userById: { id: 1, __typename: 'User' } },
          hasNext: true
        })
      );
      // Second emission: expanded deferred fragment data (Relay format)
      expect(values[1]).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Alice', email: 'alice@example.com' }),
          path: ['userById'],
          label: 'UserDetails',
          hasNext: false
        })
      );
      expect(completed).toBe(true);
    });

    it('completes Observable after final payload with hasNext:false', async () => {
      const parts = [
        {
          data: { userById: { id: 1 } },
          hasNext: true,
          pending: [{ id: '0', path: ['userById'], label: 'details' }]
        },
        {
          incremental: [{ id: '0', data: { name: 'Alice' } }],
          completed: [],
          hasNext: true
        },
        {
          incremental: [{ id: '0', data: { email: 'alice@example.com' } }],
          completed: [{ id: '0' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(3);
      expect(completed).toBe(true);
    });
  });

  describe('nested directives', () => {
    it('@defer inside @stream - multiple incremental parts all emitted in sequence', async () => {
      const parts = [
        {
          data: { allUsersList: [] },
          hasNext: true,
          pending: [{ id: '0', path: ['allUsersList'], label: 'users' }]
        },
        {
          incremental: [{ id: '0', items: [{ id: 1 }] }],
          pending: [{ id: '1', path: ['allUsersList', 0], label: 'UserDetails' }],
          completed: [],
          hasNext: true
        },
        {
          incremental: [
            { id: '1', data: { name: 'Alice', email: 'alice@example.com' } },
            { id: '0', items: [{ id: 2 }] }
          ],
          pending: [{ id: '2', path: ['allUsersList', 1], label: 'UserDetails' }],
          completed: [{ id: '1' }],
          hasNext: true
        },
        {
          incremental: [{ id: '2', data: { name: 'Bob', email: 'bob@example.com' } }],
          completed: [{ id: '0' }, { id: '2' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      // Part 0: initial → { data, hasNext } (pending stripped)
      // Part 1: incremental [id:0 items] → expanded to { items, path, label, hasNext }
      // Part 2: incremental [id:1 data, id:0 items] → 2 expanded responses
      // Part 3: incremental [id:2 data] → expanded
      expect(values).toHaveLength(5);
      expect(values[0]).toEqual(
        expect.objectContaining({ data: { allUsersList: [] }, hasNext: true })
      );
      expect(values[1]).toEqual(
        expect.objectContaining({
          items: [{ id: 1 }],
          path: ['allUsersList'],
          label: 'users',
          hasNext: true
        })
      );
      // Part 2 has 2 incremental items expanded
      expect(values[2]).toEqual(
        expect.objectContaining({
          data: { name: 'Alice', email: 'alice@example.com' },
          path: ['allUsersList', 0],
          label: 'UserDetails'
        })
      );
      expect(values[3]).toEqual(
        expect.objectContaining({
          items: [{ id: 2 }],
          path: ['allUsersList'],
          label: 'users'
        })
      );
      expect(values[4]).toEqual(
        expect.objectContaining({
          data: { name: 'Bob', email: 'bob@example.com' },
          path: ['allUsersList', 1],
          label: 'UserDetails',
          hasNext: false
        })
      );
      expect(completed).toBe(true);
    });

    it('@stream inside @defer - deferred fragment containing streamed list items', async () => {
      const parts = [
        {
          data: { userById: { id: 1 } },
          hasNext: true,
          pending: [{ id: '0', path: ['userById'], label: 'UserWithPosts' }]
        },
        {
          incremental: [{ id: '0', data: { posts: [] } }],
          pending: [{ id: '1', path: ['userById', 'posts'], label: 'PostItems' }],
          completed: [{ id: '0' }],
          hasNext: true
        },
        {
          incremental: [{ id: '1', items: [{ id: 101, title: 'Post 1' }] }],
          completed: [],
          hasNext: true
        },
        {
          incremental: [{ id: '1', items: [{ id: 102, title: 'Post 2' }] }],
          completed: [{ id: '1' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(4);
      // Initial payload (pending stripped)
      expect(values[0]).toEqual(
        expect.objectContaining({ data: { userById: { id: 1 } }, hasNext: true })
      );
      // Deferred fragment with empty posts (Relay format)
      expect(values[1]).toEqual(
        expect.objectContaining({
          data: { posts: [] },
          path: ['userById'],
          label: 'UserWithPosts'
        })
      );
      // Streamed post items (Relay format)
      expect(values[2]).toEqual(
        expect.objectContaining({
          items: [{ id: 101, title: 'Post 1' }],
          path: ['userById', 'posts'],
          label: 'PostItems'
        })
      );
      expect(values[3]).toEqual(
        expect.objectContaining({
          items: [{ id: 102, title: 'Post 2' }],
          path: ['userById', 'posts'],
          label: 'PostItems',
          hasNext: false
        })
      );
      expect(completed).toBe(true);
    });
  });

  describe('error handling', () => {
    it('emits GraphQL error payload as a regular value', async () => {
      const parts = [
        {
          data: null,
          errors: [{ message: 'Query failed' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(1);
      expect(values[0]).toEqual(
        expect.objectContaining({
          data: null,
          errors: [{ message: 'Query failed' }]
        })
      );
      expect(completed).toBe(true);
    });

    it('emits partial data before error in incremental payload', async () => {
      const parts = [
        {
          data: { userById: { id: 1 } },
          hasNext: true,
          pending: [{ id: '0', path: ['userById'], label: 'details' }]
        },
        {
          incremental: [
            {
              id: '0',
              data: null,
              errors: [{ message: 'Deferred field failed' }]
            }
          ],
          completed: [{ id: '0' }],
          hasNext: false
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(mockMultipartFetchResponse(parts));

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      // First value is the initial payload (pending stripped)
      expect(values[0]).toEqual(
        expect.objectContaining({ data: { userById: { id: 1 } }, hasNext: true })
      );
      // Second value: expanded Relay format with error
      expect(values[1]).toEqual(
        expect.objectContaining({
          data: null,
          path: ['userById'],
          label: 'details',
          errors: [{ message: 'Deferred field failed' }],
          hasNext: false
        })
      );
      expect(completed).toBe(true);
    });

    it('calls sink.error when JSON parsing fails for non-multipart response', async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        body: null
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { error } = await subscribeAndCollect(observable);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Invalid JSON');
    });

    it('handles malformed multipart response gracefully', async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              '\r\n------abc\r\nContent-Type: application/json\r\n\r\n{invalid json'
            )
          );
          controller.close();
        }
      });

      const mockResponse = {
        status: 200,
        headers: new Headers({
          'Content-Type': 'multipart/mixed; boundary=----abc'
        }),
        body: stream,
        json: vi.fn().mockResolvedValue({})
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      // With malformed JSON, the parser won't emit parts, stream closes → complete
      expect(completed).toBe(true);
      expect(values).toHaveLength(0);
    });

    it('propagates fetch rejection to sink.error for uncached queries', async () => {
      const queryCache = new QueryCache(); // empty cache

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      const network = createClientNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'fetch-reject-query' });
      const observable = network.execute(request, {}, {}, null);
      const { error, values } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(0);
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Network failure');
    });

    it('calls sink.error when multipart stream errors mid-flight', async () => {
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

      const network = createClientNetwork();
      const observable = network.execute(createMockRequestParameters(), {}, {}, null);
      const { error } = await subscribeAndCollect(observable);

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Stream error');
    });
  });

  describe('cache path', () => {
    it('returns Observable from cached query ReplaySubject (no fetch)', async () => {
      const queryCache = new QueryCache();
      const operation = createMockOperationDescriptor({ id: 'cached-query' });
      const query = queryCache.build(operation);

      // Pre-populate query with SSR data
      const ssrData = { data: { userById: { id: 1, name: 'Alice' } } } as GraphQLResponse;
      query.next(ssrData);
      query.complete();

      globalThis.fetch = vi.fn();

      const network = createClientNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'cached-query' });
      const observable = network.execute(request, {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(1);
      expect(values[0]).toEqual(ssrData);
      expect(completed).toBe(true);
      // No fetch should have been made
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('falls back to multipartFetch when query is not in cache', async () => {
      const queryCache = new QueryCache(); // empty cache
      const data = { data: { userById: { id: 1 } } };

      globalThis.fetch = vi.fn().mockResolvedValue(mockJsonFetchResponse(data));

      const network = createClientNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'uncached-query' });
      const observable = network.execute(request, {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(globalThis.fetch).toHaveBeenCalled();
      expect(values).toHaveLength(1);
      expect(values[0]).toEqual(data);
      expect(completed).toBe(true);
    });

    it('replays all previously-emitted incremental events to late subscriber', async () => {
      const queryCache = new QueryCache();
      const operation = createMockOperationDescriptor({ id: 'replay-query' });
      const query = queryCache.build(operation);

      // Simulate SSR: push multiple incremental events before subscribing
      const part1 = { data: { userById: { id: 1 } }, hasNext: true } as GraphQLResponse;
      const part2 = {
        incremental: [{ id: '0', data: { name: 'Alice' } }],
        hasNext: false
      } as unknown as GraphQLResponse;

      query.next(part1);
      query.next(part2);
      query.complete();

      const network = createClientNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'replay-query' });

      // Subscribe after all events have been pushed
      const observable = network.execute(request, {}, {}, null);
      const { values, completed } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(2);
      expect(values[0]).toEqual(part1);
      expect(values[1]).toEqual(part2);
      expect(completed).toBe(true);
    });

    it('cached query with error replays error to subscriber', async () => {
      const queryCache = new QueryCache();
      const operation = createMockOperationDescriptor({ id: 'error-cache-query' });
      const query = queryCache.build(operation);

      // Simulate SSR: push data then error
      const part1 = { data: { userById: { id: 1 } }, hasNext: true } as GraphQLResponse;
      query.next(part1);
      query.error('Something went wrong');

      const network = createClientNetwork(queryCache);
      const request = createMockRequestParameters({ id: 'error-cache-query' });
      const observable = network.execute(request, {}, {}, null);
      const { values, error } = await subscribeAndCollect(observable);

      expect(values).toHaveLength(1);
      expect(values[0]).toEqual(part1);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
