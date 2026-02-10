import { getBoundary } from '#@/fetch/multipart-utils.js';
import { multipartFetch } from '#@/fetch/refetch.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('refetch', () => {
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
  });

  describe('multipartFetch', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('handles JSON response for non-multipart content type', async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ data: { user: { id: '1' } } }),
        body: null
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await multipartFetch({
        url: 'http://test.com/graphql',
        getRequestInit: async () => ({
          method: 'POST',
          body: JSON.stringify({ query: '{ user { id } }' })
        }),
        onNext,
        onComplete,
        onError
      });

      expect(onNext).toHaveBeenCalledWith([{ data: { user: { id: '1' } } }]);
      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('handles multipart/mixed response with streaming', async () => {
      const boundary = '----abc123';
      const part1 = JSON.stringify({
        data: { user: { id: '1' } },
        hasNext: true
      });
      const part2 = JSON.stringify({
        incremental: [{ id: '0', data: { name: 'Alice' } }],
        hasNext: false
      });

      const responseBody =
        `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${part1}` +
        `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${part2}` +
        `\r\n--${boundary}--`;

      const encoder = new TextEncoder();
      const chunks = [encoder.encode(responseBody)];

      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        }
      });

      const mockResponse = {
        status: 200,
        headers: new Headers({
          'Content-Type': `multipart/mixed; boundary=${boundary}`
        }),
        body: stream,
        // json() shouldn't be called for multipart responses, but needs to exist
        json: vi.fn().mockResolvedValue({})
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await multipartFetch({
        url: 'http://test.com/graphql',
        getRequestInit: async () => ({
          method: 'POST',
          body: JSON.stringify({ query: '{ user { id ...UserDetails } }' })
        }),
        onNext,
        onComplete,
        onError
      });

      // Wait for stream processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onNext).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it('throws error for multipart response without body', async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          'Content-Type': 'multipart/mixed; boundary=----abc'
        }),
        body: null,
        json: vi.fn()
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await expect(
        multipartFetch({
          url: 'http://test.com/graphql',
          getRequestInit: async () => ({}),
          onNext,
          onComplete,
          onError
        })
      ).rejects.toThrow('Malformed Response');
    });

    it('uses getRequestInit to construct fetch options', async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ data: {} }),
        body: null
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const customHeaders = {
        'X-Custom-Header': 'test-value',
        Authorization: 'Bearer token'
      };

      await multipartFetch({
        url: 'http://test.com/graphql',
        getRequestInit: async () => ({
          method: 'POST',
          headers: customHeaders,
          body: JSON.stringify({ query: '{ test }' })
        }),
        onNext: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn()
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('http://test.com/graphql', {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify({ query: '{ test }' })
      });
    });

    it('handles non-2xx status codes for multipart', async () => {
      const mockResponse = {
        status: 500,
        headers: new Headers({
          'Content-Type': 'multipart/mixed; boundary=----abc'
        }),
        body: null,
        json: vi.fn().mockResolvedValue({ errors: [{ message: 'Server error' }] })
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await multipartFetch({
        url: 'http://test.com/graphql',
        getRequestInit: async () => ({}),
        onNext,
        onComplete,
        onError
      });

      // For non-2xx, it falls through to JSON handling
      expect(onNext).toHaveBeenCalledWith([{ errors: [{ message: 'Server error' }] }]);
    });

    it('handles malformed multipart data gracefully', async () => {
      // Test with malformed data that will cause a parse error
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          // Send incomplete/malformed JSON that will fail to parse
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

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await multipartFetch({
        url: 'http://test.com/graphql',
        getRequestInit: async () => ({}),
        onNext,
        onComplete,
        onError
      });

      // Wait for stream processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      // With malformed JSON, the parser won't emit any parts
      // and onComplete will be called when stream closes
      expect(onComplete).toHaveBeenCalled();
    });

    it('respects abort signal in request', async () => {
      const controller = new AbortController();

      // Create a fetch that will be aborted
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        // Verify signal was passed
        expect(init?.signal).toBe(controller.signal);

        // Simulate network delay then abort
        await new Promise((resolve) => setTimeout(resolve, 50));
        throw new DOMException('The operation was aborted', 'AbortError');
      });

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      // Start the fetch and immediately abort
      const fetchPromise = multipartFetch({
        url: 'http://test.com/graphql',
        getRequestInit: async () => ({
          method: 'POST',
          signal: controller.signal
        }),
        onNext,
        onComplete,
        onError
      });

      controller.abort();

      // The fetch should reject with abort error, not hang
      await expect(fetchPromise).rejects.toThrow('The operation was aborted');
      expect(onNext).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('calls onError when JSON parsing fails', async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        body: null
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await multipartFetch({
        url: 'http://test.com/graphql',
        getRequestInit: async () => ({
          method: 'POST',
          body: JSON.stringify({ query: '{ user { id } }' })
        }),
        onNext,
        onComplete,
        onError
      });

      // Should call onError instead of hanging
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toContain('Invalid JSON');
      expect(onNext).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('calls onError when fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await expect(
        multipartFetch({
          url: 'http://test.com/graphql',
          getRequestInit: async () => ({
            method: 'POST'
          }),
          onNext,
          onComplete,
          onError
        })
      ).rejects.toThrow('Network error');

      expect(onNext).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('calls onError when multipart stream has error', async () => {
      let chunkCount = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          chunkCount++;
          if (chunkCount === 1) {
            // First chunk: send some data
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('\r\n------abc\r\n'));
          } else {
            // Second pull: error
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

      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await multipartFetch({
        url: 'http://test.com/graphql',
        getRequestInit: async () => ({}),
        onNext,
        onComplete,
        onError
      });

      // Wait for stream processing
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should call onError when stream errors
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toContain('Stream error');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('does not hang when getRequestInit throws', async () => {
      const onNext = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await expect(
        multipartFetch({
          url: 'http://test.com/graphql',
          getRequestInit: async () => {
            throw new Error('Failed to get auth token');
          },
          onNext,
          onComplete,
          onError
        })
      ).rejects.toThrow('Failed to get auth token');

      expect(onNext).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
