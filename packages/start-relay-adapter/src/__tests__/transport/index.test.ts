import {
  createMockOperationDescriptor,
  collectStream,
  flushMicrotasks
} from '../utils/index.js';

import { QueryRecord } from '#@/cache/relay-query.js';
import { ClientTransport } from '#@/transport/client.js';
import { transportSerializationAdapter } from '#@/transport/serialization-adapter.js';
import { ServerTransport } from '#@/transport/server.js';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';

describe('ServerTransport', () => {
  let originalDateNow: typeof Date.now;

  beforeEach(() => {
    originalDateNow = Date.now;
    Date.now = vi.fn(() => 1700000000000);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('constructor', () => {
    it('creates a ServerTransport with a readable stream', () => {
      const transport = new ServerTransport();
      expect(transport.stream).toBeInstanceOf(ReadableStream);
    });
  });

  describe('trackQuery', () => {
    it('enqueues started event to stream', async () => {
      const transport = new ServerTransport();
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const query = new QueryRecord(operation);

      transport.trackQuery({
        event: { type: 'started', id: query.queryKey, operation },
        query
      });

      // Complete the query to allow stream to close
      query.complete();
      transport.drainAndClose();

      const events = await collectStream(transport.stream);
      expect(events[0]).toEqual({
        type: 'started',
        id: query.queryKey,
        operation
      });
    });

    it('enqueues progress events from query subscription', async () => {
      const transport = new ServerTransport();
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const query = new QueryRecord(operation);

      transport.trackQuery({
        event: { type: 'started', id: query.queryKey, operation },
        query
      });

      query.next({ data: { user: { id: '1' } } });
      query.next({ data: { user: { id: '1', name: 'Alice' } } });
      query.complete();
      transport.drainAndClose();

      const events = await collectStream(transport.stream);

      // started + 2 next (complete triggers finalize but QueryRecord.subscribe
      // only forwards 'next' type events to observer.next; 'complete' triggers observer.complete())
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('started');
      expect(events[1].type).toBe('next');
      expect(events[2].type).toBe('next');
    });

    it('handles multiple concurrent queries', async () => {
      const transport = new ServerTransport();

      const operation1 = createMockOperationDescriptor({
        id: 'Query1',
        variables: {}
      });
      const operation2 = createMockOperationDescriptor({
        id: 'Query2',
        variables: {}
      });

      const query1 = new QueryRecord(operation1);
      const query2 = new QueryRecord(operation2);

      transport.trackQuery({
        event: { type: 'started', id: query1.queryKey, operation: operation1 },
        query: query1
      });
      transport.trackQuery({
        event: { type: 'started', id: query2.queryKey, operation: operation2 },
        query: query2
      });

      query1.next({ data: { result: 1 } });
      query2.next({ data: { result: 2 } });
      query1.complete();
      query2.complete();
      transport.drainAndClose();

      const events = await collectStream(transport.stream);

      // 2 started + 2 next (complete events trigger finalize, not stream events)
      expect(events).toHaveLength(4);
    });
  });

  describe('streamValue', () => {
    it('enqueues value event to stream', async () => {
      const transport = new ServerTransport();

      transport.streamValue('test-id', { custom: 'data' });
      transport.drainAndClose();

      const events = await collectStream(transport.stream);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'value',
        id: 'test-id',
        value: { custom: 'data' }
      });
    });
  });

  describe('drainAndClose', () => {
    it('closes stream immediately when no ongoing requests', async () => {
      const transport = new ServerTransport();
      transport.drainAndClose();

      const events = await collectStream(transport.stream);
      expect(events).toEqual([]);
    });

    it('waits for ongoing requests to complete before closing', async () => {
      const transport = new ServerTransport();
      const operation = createMockOperationDescriptor({ id: 'TestQuery' });
      const query = new QueryRecord(operation);

      transport.trackQuery({
        event: { type: 'started', id: query.queryKey, operation },
        query
      });

      transport.drainAndClose();

      // Stream should not close yet - query is still ongoing
      // Complete the query
      query.next({ data: {} });
      query.complete();

      const events = await collectStream(transport.stream);
      expect(events.length).toBeGreaterThan(0);
    });
  });
});

describe('ClientTransport', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('constructor', () => {
    it('consumes a transported stream', async () => {
      const events = [
        { type: 'started' as const, id: 'test', operation: {} as any },
        { type: 'next' as const, id: 'test', data: { result: 1 } },
        { type: 'complete' as const, id: 'test' }
      ];

      const stream = new ReadableStream({
        start(controller) {
          for (const event of events) {
            controller.enqueue(event);
          }
          controller.close();
        }
      });

      const client = new ClientTransport(stream);
      await flushMicrotasks();

      // Events should be replayed via ReplaySubject
      const received: any[] = [];
      client.subscribeToEvents({ next: (event) => received.push(event) });

      expect(received).toHaveLength(3);
    });
  });

  describe('subscribeToEvents', () => {
    it('receives replayed events when subscribing after consumption', async () => {
      const events = [
        { type: 'started' as const, id: 'q1', operation: {} as any },
        { type: 'next' as const, id: 'q1', data: { x: 1 } }
      ];

      const stream = new ReadableStream({
        start(controller) {
          for (const event of events) {
            controller.enqueue(event);
          }
          controller.close();
        }
      });

      const client = new ClientTransport(stream);
      await flushMicrotasks();

      const received: any[] = [];
      client.subscribeToEvents({ next: (event) => received.push(event) });

      expect(received).toEqual(events);
    });

    it('receives new events in real-time after subscribing', async () => {
      let controller!: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(c) {
          controller = c;
        }
      });

      const client = new ClientTransport(stream);
      await flushMicrotasks();

      const received: any[] = [];
      client.subscribeToEvents({ next: (event) => received.push(event) });

      // Enqueue after subscribing
      controller.enqueue({ type: 'started', id: 'q1', operation: {} });
      await flushMicrotasks();

      controller.enqueue({ type: 'next', id: 'q1', data: {} });
      await flushMicrotasks();

      expect(received).toHaveLength(2);
    });
  });

  describe('value streaming', () => {
    it('stores and retrieves streamed values', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'value', id: ':id1:', value: 'test-value' });
          controller.close();
        }
      });

      const client = new ClientTransport(stream);
      await flushMicrotasks();

      expect(client.getStreamedValue(':id1:')).toBe('test-value');
    });

    it('returns undefined for non-existent values', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close();
        }
      });

      const client = new ClientTransport(stream);
      await flushMicrotasks();

      expect(client.getStreamedValue('non-existent')).toBeUndefined();
    });

    it('can consume streamed values', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'value', id: 'val1', value: 'data' });
          controller.close();
        }
      });

      const client = new ClientTransport(stream);
      await flushMicrotasks();

      expect(client.getStreamedValue('val1')).toBe('data');
      client.consumeStreamedValue('val1');
      expect(client.getStreamedValue('val1')).toBeUndefined();
    });

    it('separates value events from query events', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'value', id: 'v1', value: 'stored' });
          controller.enqueue({
            type: 'started',
            id: 'q1',
            operation: {} as any
          });
          controller.close();
        }
      });

      const client = new ClientTransport(stream);
      await flushMicrotasks();

      const queryEvents: any[] = [];
      client.subscribeToEvents({ next: (event) => queryEvents.push(event) });

      // Value should be stored
      expect(client.getStreamedValue('v1')).toBe('stored');
      // Only query event should be emitted
      expect(queryEvents).toHaveLength(1);
      expect(queryEvents[0].type).toBe('started');
    });
  });
});

describe('transportSerializationAdapter', () => {
  it('has the correct key', () => {
    expect(transportSerializationAdapter.key).toBe('relay-ssr-transport');
  });

  it('identifies ServerTransport instances', () => {
    const transport = new ServerTransport();
    expect(transportSerializationAdapter.test(transport)).toBe(true);
  });

  it('does not identify non-ServerTransport values', () => {
    expect(transportSerializationAdapter.test({})).toBe(false);
    expect(transportSerializationAdapter.test(null)).toBe(false);
    expect(transportSerializationAdapter.test('string')).toBe(false);
    expect(transportSerializationAdapter.test(new ClientTransport(new ReadableStream()))).toBe(
      false
    );
  });

  it('serializes ServerTransport to its stream', () => {
    const transport = new ServerTransport();
    const serialized = transportSerializationAdapter.toSerializable(transport);
    expect(serialized).toBe(transport.stream);
  });

  it('deserializes stream to ClientTransport', () => {
    const stream = new ReadableStream();
    const client = transportSerializationAdapter.fromSerializable(stream);
    expect(client).toBeInstanceOf(ClientTransport);
  });
});
