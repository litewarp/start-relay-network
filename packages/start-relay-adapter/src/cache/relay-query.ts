import { buildQueryKey } from './query-utils';

import type { QueryProgressEvent } from '#@/transport/types.js';
import type {
  Subscribable,
  OperationDescriptor,
  ReplaySubject,
  GraphQLResponse
} from 'relay-runtime';

import runtime from 'relay-runtime';

export class QueryRecord implements Subscribable<QueryProgressEvent> {
  readonly operation: OperationDescriptor;
  readonly queryKey: string;
  private _replaySubject: ReplaySubject<QueryProgressEvent>;

  constructor(operation: OperationDescriptor) {
    this.operation = operation;
    this.queryKey = buildQueryKey(this.operation);
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

  dispose(): void {
    this._replaySubject.complete();
  }
}

/** @deprecated Use `QueryRecord` instead */
export const RelayQuery = QueryRecord;
/** @deprecated Use `QueryRecord` instead */
export type RelayQuery = QueryRecord;
