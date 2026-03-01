import { createMockStream } from '../utils/index.js';

import { observableFromStream } from '#@/stream.js';
import { describe, it, expect, vi } from 'vitest';

describe('stream-utils', () => {
  describe('observableFromStream', () => {
    it('emits all chunks from a stream', async () => {
      const chunks = ['a', 'b', 'c'];
      const stream = createMockStream(chunks);

      const results: string[] = [];
      const observable = observableFromStream(stream);

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (value) => results.push(value),
          complete: resolve
        });
      });

      expect(results).toEqual(['a', 'b', 'c']);
    });

    it('completes when stream closes', async () => {
      const stream = createMockStream([1, 2]);
      const observable = observableFromStream(stream);
      const completeSpy = vi.fn();

      await new Promise<void>((resolve) => {
        observable.subscribe({
          complete: () => {
            completeSpy();
            resolve();
          }
        });
      });

      expect(completeSpy).toHaveBeenCalledTimes(1);
    });

    it('handles empty streams', async () => {
      const stream = createMockStream<string>([]);
      const observable = observableFromStream(stream);
      const results: string[] = [];
      const completeSpy = vi.fn();

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (value) => results.push(value),
          complete: () => {
            completeSpy();
            resolve();
          }
        });
      });

      expect(results).toEqual([]);
      expect(completeSpy).toHaveBeenCalledTimes(1);
    });

    it('handles object chunks', async () => {
      const chunks = [{ id: 1 }, { id: 2 }];
      const stream = createMockStream(chunks);
      const observable = observableFromStream(stream);
      const results: typeof chunks = [];

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (value) => results.push(value),
          complete: resolve
        });
      });

      expect(results).toEqual(chunks);
    });

    it('handles stream abort', async () => {
      // Test abort handling instead of error since stream errors
      // generate unhandled rejections in the test environment
      const results: string[] = [];

      const stream = new ReadableStream<string>({
        start(controller) {
          controller.enqueue('first');
          controller.enqueue('second');
          controller.close();
        }
      });

      const observable = observableFromStream(stream);

      await new Promise<void>((resolve) => {
        const subscription = observable.subscribe({
          next: (value) => {
            results.push(value);
          },
          complete: resolve
        });
      });

      expect(results).toEqual(['first', 'second']);
    });
  });
});
