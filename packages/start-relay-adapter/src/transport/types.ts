import { ClientTransport } from './client.js';
import { ServerTransport } from './server.js';

import type { RelayQuery } from '#@/cache/relay-query.js';
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

export interface ValueEvent<T = unknown> {
  type: 'value';
  value: T;
  id: string;
}
export type QueryProgressEvent = Exclude<QueryEvent, { type: 'started' }>;

export type Transported = ReadableStream<QueryEvent | ValueEvent>;

export type DataTransportProviderImplementation<TExtraProps> = FC<
  {
    /** will be present in the Browser */
    onQueryEvent?: (event: QueryEvent) => void;
    /** will be present in the Browser */
    rerunSimulatedQueries?: () => void;
    /** will be present during SSR */
    registerDispatchRequestStarted?: (
      callback: (query: {
        event: Extract<QueryEvent, { type: 'started' }>;
        query: RelayQuery;
      }) => void
    ) => void;
    /** will always be present */
    children: React.ReactNode;
  } & TExtraProps
>;

export type Transport = ServerTransport | ClientTransport;

/**
 * TODO: IMPLEMENT AND TEST OR REMOVE
 */
export interface DataTransportAbstraction {
  /**
   * This hook should always return the first value it was called with.
   *
   * If used in the browser and SSR happened, it should return the value passed to it on the server.
   */
  useStaticValueRef<T>(value: T): { current: T };
}
