import type { QueryEvent, TransportStream } from './types.js';

import { debugTransportClient, errorRelay } from '#@/debug.js';
import { observableFromStream } from '#@/stream.js';
import runtime from 'relay-runtime';

export class ClientTransport {
  private _eventSubject = new runtime.ReplaySubject<QueryEvent>();

  constructor(stream: TransportStream) {
    void this.consume(stream);
  }

  private async consume(stream: TransportStream) {
    debugTransportClient('Consuming stream');
    observableFromStream(stream).subscribe({
      next: (event) => {
        debugTransportClient('Received event:', event);
        this._eventSubject.next(event);
      },
      complete: () => {
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
}
