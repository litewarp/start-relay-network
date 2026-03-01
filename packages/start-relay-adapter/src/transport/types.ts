import { ClientTransport } from './client.js';
import { ServerTransport } from './server.js';

import type { QueryRecord } from '#@/cache/relay-query.js';
import type { FC } from 'react';
import type { GraphQLResponse, OperationDescriptor } from 'relay-runtime';

export type ReadableStreamRelayEvent<T extends GraphQLResponse = GraphQLResponse> =
  | { type: 'next'; data: T }
  | { type: 'error'; error: string | Record<string, unknown> }
  | { type: 'complete' };

export type QueryEvent =
  | {
      type: 'started';
      operation: OperationDescriptor;
      id: string;
    }
  | (ReadableStreamRelayEvent & {
      id: string;
    });

export type QueryProgressEvent = Exclude<QueryEvent, { type: 'started' }>;

export type TransportStream = ReadableStream<QueryEvent>;

/** @deprecated Use `TransportStream` instead */
export type Transported = TransportStream;

export type TransportProviderComponent<TExtraProps> = FC<
  {
    /** will be present in the Browser */
    onQueryEvent?: (event: QueryEvent) => void;
    /** will be present in the Browser */
    onStreamClosed?: () => void;
    /** will be present during SSR */
    registerTrackQuery?: (
      callback: (query: {
        event: Extract<QueryEvent, { type: 'started' }>;
        query: QueryRecord;
      }) => void
    ) => void;
    /** will always be present */
    children: React.ReactNode;
  } & TExtraProps
>;

/** @deprecated Use `TransportProviderComponent` instead */
export type DataTransportProviderImplementation<T> = TransportProviderComponent<T>;

export type Transport = ServerTransport | ClientTransport;
