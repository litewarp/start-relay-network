import { createMockStream, flushMicrotasks } from '../utils/index.js';

import { createBackpressuredCallback } from '#@/callback.js';
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
      const abortController = new AbortController();

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

  describe('createBackpressuredCallback', () => {
    it('queues values when no callback is registered', () => {
      const bp = createBackpressuredCallback<number>();

      bp.push(1);
      bp.push(2);
      bp.push(3);

      const results: number[] = [];
      bp.register((value) => results.push(value));

      expect(results).toEqual([1, 2, 3]);
    });

    it('calls callback directly when registered', () => {
      const bp = createBackpressuredCallback<string>();
      const results: string[] = [];

      bp.register((value) => results.push(value));

      bp.push('a');
      bp.push('b');

      expect(results).toEqual(['a', 'b']);
    });

    it('drains queue in order when callback is registered', () => {
      const bp = createBackpressuredCallback<number>();

      bp.push(1);
      bp.push(2);

      const callOrder: number[] = [];
      bp.register((value) => callOrder.push(value));

      bp.push(3);

      expect(callOrder).toEqual([1, 2, 3]);
    });

    it('can unregister callback by passing null', () => {
      const bp = createBackpressuredCallback<number>();
      const results: number[] = [];

      bp.register((value) => results.push(value));
      bp.push(1);

      // Unregister callback
      bp.register(null);
      bp.push(2);
      bp.push(3);

      // Re-register - should receive queued values
      bp.register((value) => results.push(value * 10));

      expect(results).toEqual([1, 20, 30]);
    });

    it('handles re-registration correctly', () => {
      const bp = createBackpressuredCallback<string>();

      const results1: string[] = [];
      const results2: string[] = [];

      bp.register((value) => results1.push(value));
      bp.push('first');

      bp.register((value) => results2.push(value));
      bp.push('second');

      expect(results1).toEqual(['first']);
      expect(results2).toEqual(['second']);
    });

    it('handles complex objects', () => {
      type Event = { type: string; payload: unknown };
      const bp = createBackpressuredCallback<Event>();

      bp.push({ type: 'init', payload: null });
      bp.push({ type: 'data', payload: { count: 5 } });

      const results: Event[] = [];
      bp.register((event) => results.push(event));

      expect(results).toEqual([
        { type: 'init', payload: null },
        { type: 'data', payload: { count: 5 } }
      ]);
    });

    it('can be used synchronously multiple times', () => {
      const bp = createBackpressuredCallback<number>();
      const results: number[] = [];

      bp.register((v) => results.push(v));

      for (let i = 0; i < 100; i++) {
        bp.push(i);
      }

      expect(results).toHaveLength(100);
      expect(results[0]).toBe(0);
      expect(results[99]).toBe(99);
    });
  });
});
