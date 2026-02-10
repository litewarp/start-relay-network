import type { RelayQuery } from '#@/cache/relay-query.js';
import type {
  Transported,
  QueryEvent,
  ValueEvent,
  DataTransportAbstraction
} from './types.js';

import { useId, useRef } from 'react';

export class ServerTransport implements DataTransportAbstraction {
  stream: Transported;
  private controller!: ReadableStreamDefaultController<QueryEvent | ValueEvent>;
  private ongoingStreams = new Set<Extract<QueryEvent, { type: 'started' }>>();

  private closed = false;
  private shouldClose = false;

  constructor() {
    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      }
    });
  }

  closeOnceFinished() {
    this.shouldClose = true;
    this.closeIfFinished();
  }

  private closeIfFinished() {
    if (this.shouldClose && this.ongoingStreams.size === 0 && !this.closed) {
      this.controller.close();
      this.closed = true;
    }
  }

  // TODO: FIX mismatch between queryprogressevent and graphqlresponse
  dispatchRequestStarted = ({
    event,
    query
  }: {
    event: Extract<QueryEvent, { type: 'started' }>;
    query: RelayQuery;
  }): void => {
    this.controller.enqueue(event);
    this.ongoingStreams.add(event);
    const finalize = () => {
      this.ongoingStreams.delete(event);
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
