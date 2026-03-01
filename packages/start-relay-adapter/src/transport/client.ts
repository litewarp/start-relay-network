import type { TransportAdapter, QueryEvent, TransportStream } from './types.js';

import { debugTransportClient, errorRelay } from '#@/debug.js';
import { observableFromStream } from '#@/stream.js';
import { type RefObject, useId, useEffect, useRef } from 'react';
import runtime from 'relay-runtime';

export class ClientTransport implements TransportAdapter {
  private _eventSubject = new runtime.ReplaySubject<QueryEvent>();
  private receivedValues: Record<string, unknown> = {};
  private streamClosed = false;

  constructor(stream: TransportStream) {
    void this.consume(stream);
  }

  private async consume(stream: TransportStream) {
    debugTransportClient('Consuming stream');
    observableFromStream(stream).subscribe({
      next: (event) => {
        if (event.type === 'value') {
          this.receivedValues[event.id] = event.value;
        } else {
          debugTransportClient('Received event:', event);
          this._eventSubject.next(event);
        }
      },
      complete: () => {
        this.streamClosed = true;
        this._eventSubject.complete();
      },
      error: (error: unknown) => {
        errorRelay('Error in ClientTransport:', error);
        this._eventSubject.error(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Subscribe to query events. Late subscribers receive all past events
   * via the ReplaySubject, then get new events as they arrive.
   */
  subscribeToEvents(observer: runtime.Observer<QueryEvent>): runtime.Subscription {
    return this._eventSubject.subscribe(observer);
  }

  /** Called when the transport stream closes to re-execute incomplete queries. */
  public onStreamClosed?: () => void;

  public getStreamedValue<T>(id: string): T | undefined {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return this.receivedValues[id] as T | undefined;
  }

  public consumeStreamedValue<T>(id: string): T | undefined {
    const value = this.getStreamedValue<T>(id);
    delete this.receivedValues[id];
    return value;
  }

  useStaticValueRef = <T>(value: T): RefObject<T> => {
    const id = useId();
    const streamedValue = this.getStreamedValue<T>(id);
    const dataValue = streamedValue !== undefined ? streamedValue : value;

    useEffect(() => {
      this.consumeStreamedValue(id);
    }, [id]);
    return useRef(dataValue);
  };
}
