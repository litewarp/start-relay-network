import type { RelayObservable } from 'relay-runtime/lib/network/RelayObservable.js';

import { Observable } from 'relay-runtime';

export function observableFromStream<T>(stream: ReadableStream<T>): RelayObservable<T> {
  return Observable.create<T>((subscriber) => {
    void stream
      .pipeTo(
        new WritableStream({
          write: (chunk) => subscriber.next(chunk),
          abort: (error) => subscriber.error(error),
          close: () => subscriber.complete()
        })
      )
      .catch(() => {
        // Error already handled by abort handler above
      });
    return () => {
      if (!stream.locked) {
        void stream.cancel();
      }
    };
  });
}
