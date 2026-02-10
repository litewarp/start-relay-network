import type { QueryCache } from '#@/query-cache.js';
import type {
  DataTransportAbstraction,
  DataTransportProviderImplementation
} from './types.js';

import { createContext, useMemo } from 'react';
import relay from 'react-relay';
import { Environment } from 'relay-runtime';

const { RelayEnvironmentProvider } = relay;

export type GetEnvironmentFn = () => {
  environment: Environment;
  queryCache: QueryCache;
};

export type WrappedRelayProviderProps<P> = {
  getEnvironment: GetEnvironmentFn;
  children: React.ReactNode;
} & P;

export const DataTransportContext = createContext<DataTransportAbstraction | null>(null);

export function WrapRelayProvider<P>(
  TransportProvider: DataTransportProviderImplementation<P>
) {
  const WrappedRelayProvider = (props: WrappedRelayProviderProps<P>) => {
    const { getEnvironment, children, ...extraProps } = props;

    const { environment, queryCache } = useMemo(() => getEnvironment(), [getEnvironment]);

    return (
      <RelayEnvironmentProvider environment={environment}>
        <TransportProvider
          onQueryEvent={(event) =>
            event.type === 'started'
              ? queryCache.onQueryStarted(event)
              : queryCache.onQueryProgress(event)
          }
          rerunSimulatedQueries={() => queryCache.rerunSimulatedQueries(environment)}
          registerDispatchRequestStarted={queryCache.watchQueryQueue?.register}
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          {...(extraProps as P)}
        >
          {children}
        </TransportProvider>
      </RelayEnvironmentProvider>
    );
  };
  return WrappedRelayProvider;
}
