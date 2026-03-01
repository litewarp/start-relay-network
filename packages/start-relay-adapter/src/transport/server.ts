import type { QueryRecord } from '#@/cache/relay-query.js';
import type {
  TransportStream,
  QueryEvent,
  ValueEvent,
  TransportAdapter
} from './types.js';

import { useId, useRef } from 'react';

export class ServerTransport implements TransportAdapter {
  stream: TransportStream;
  private controller!: ReadableStreamDefaultController<QueryEvent | ValueEvent>;
  private pendingQueries = new Set<Extract<QueryEvent, { type: 'started' }>>();

  private closed = false;
  private shouldClose = false;

  constructor() {
    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      }
    });
  }

  drainAndClose() {
    this.shouldClose = true;
    this.closeIfFinished();
  }

  private closeIfFinished() {
    if (this.shouldClose && this.pendingQueries.size === 0 && !this.closed) {
      this.controller.close();
      this.closed = true;
    }
  }

  trackQuery = ({
    event,
    query
  }: {
    event: Extract<QueryEvent, { type: 'started' }>;
    query: QueryRecord;
  }): void => {
    this.controller.enqueue(event);
    this.pendingQueries.add(event);
    const finalize = () => {
      this.pendingQueries.delete(event);
      this.closeIfFinished();
    };
    query.subscribe({
      next: (ev) => {
        if (!this.closed) {
          this.controller.enqueue(ev);
        }
      },
      error: finalize,
      complete: finalize
    });
  };

  streamValue(id: string, value: unknown) {
    this.controller.enqueue({ type: 'value', id, value });
  }

  useStaticValueRef = <T>(value: T): { current: T } => {
    const id = useId();
    this.streamValue(id, value);
    return useRef(value);
  };
}
