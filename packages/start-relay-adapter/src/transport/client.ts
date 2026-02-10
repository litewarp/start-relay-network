import type { DataTransportAbstraction, QueryEvent, Transported } from './types.js';

import { debugTransportClient, errorRelay } from '#@/debug.js';
import { observableFromStream } from '#@/stream.js';
import { type RefObject, useId, useEffect, useRef } from 'react';

export class ClientTransport implements DataTransportAbstraction {
  private bufferedEvents: QueryEvent[] = [];
  private receivedValues: Record<string, unknown> = {};

  constructor(stream: Transported) {
    void this.consume(stream);
  }

  private async consume(stream: Transported) {
    debugTransportClient('Consuming stream');
    observableFromStream(stream).subscribe({
      next: (event) => {
        if (event.type === 'value') {
          this.receivedValues[event.id] = event.value;
        } else {
          debugTransportClient('Pushing event:', event);
          this.bufferedEvents.push(event);
        }
      },
      complete: () => {
        // this.rerunSimulatedQueries?.();
      },
      error: (error: unknown) => {
        errorRelay('Error in ClientTransport:', error);
      }
    });
  }
  // this will be set from the `WrapApolloProvider` data transport

  public set onQueryEvent(cb: (event: QueryEvent) => void) {
    let event: QueryEvent | undefined;
    while ((event = this.bufferedEvents.shift())) {
      cb(event);
    }
    this.bufferedEvents.push = (...events: QueryEvent[]) => {
      for (const event of events) {
        cb(event);
      }
      return 0;
    };
  }
  // this will be set from the `WrapApolloProvider` data transport
  public rerunSimulatedQueries?: () => void;

  public getStreamedValue<T>(id: string): T | undefined {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return this.receivedValues[id] as T | undefined;
  }
  public deleteStreamedValue(id: string) {
    delete this.receivedValues[id];
  }

  useStaticValueRef = <T>(value: T): RefObject<T> => {
    const id = useId();
    const streamedValue = this.getStreamedValue<T>(id);
    const dataValue = streamedValue !== undefined ? streamedValue : value;

    useEffect(() => {
      this.deleteStreamedValue(id);
    }, [id]);
    return useRef(dataValue);
  };
}
