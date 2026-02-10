import { buildQueryKey, buildUniqueKey } from './query-utils';

import type { QueryProgressEvent } from '#@/transport/types.js';
import type {
  Subscribable,
  OperationDescriptor,
  ReplaySubject,
  GraphQLResponse
} from 'relay-runtime';

import runtime from 'relay-runtime';

export class RelayQuery implements Subscribable<QueryProgressEvent> {
  private _uuid: string;
  private _operation: OperationDescriptor;
  private _replaySubject: ReplaySubject<QueryProgressEvent>;
  private _subscription: runtime.Subscription | null = null;
  queryKey: string;

  isComplete = false;
  hasData = false;

  constructor(operation: OperationDescriptor) {
    this._operation = operation;
    this.queryKey = buildQueryKey(this._operation);
    this._uuid = buildUniqueKey(this.queryKey);
    this._replaySubject = new runtime.ReplaySubject<QueryProgressEvent>();
  }

  complete() {
    this._replaySubject.next({ type: 'complete', id: this.queryKey });
    this._replaySubject.complete();
  }

  error(error: string) {
    this._replaySubject.next({ type: 'error', id: this.queryKey, error });
    this._replaySubject.error(new Error(error));
  }

  next<T extends GraphQLResponse = GraphQLResponse>(data: T) {
    this._replaySubject.next({ type: 'next', id: this.queryKey, data });
  }

  subscribe(observer: runtime.Observer<QueryProgressEvent>): runtime.Subscription {
    return this._replaySubject.subscribe({
      next: (event) => {
        switch (event.type) {
          case 'complete':
            observer.complete?.();
            break;
          case 'error':
            observer.error?.(new Error(JSON.stringify(event.error)));
            break;
          case 'next':
            observer.next?.(event);
            break;
        }
      }
    });
  }

  unsubscribe(): void {
    this._replaySubject.complete();
  }

  getOperation(): OperationDescriptor {
    return this._operation;
  }
}
