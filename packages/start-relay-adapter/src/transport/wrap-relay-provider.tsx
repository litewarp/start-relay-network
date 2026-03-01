import type { QueryRegistry } from '#@/query-cache.js';
import type {
  TransportAdapter,
  TransportProviderComponent
} from './types.js';

import { createContext, useMemo } from 'react';
import relay from 'react-relay';
import { Environment } from 'relay-runtime';

const { RelayEnvironmentProvider } = relay;

export type GetEnvironmentFn = () => {
  environment: Environment;
  queryRegistry: QueryRegistry;
};

export type WrappedRelayProviderProps<P> = {
  getEnvironment: GetEnvironmentFn;
  children: React.ReactNode;
} & P;

export const DataTransportContext = createContext<TransportAdapter | null>(null);

export function WrapRelayProvider<P>(
  TransportProvider: TransportProviderComponent<P>
) {
  const WrappedRelayProvider = (props: WrappedRelayProviderProps<P>) => {
    const { getEnvironment, children, ...extraProps } = props;

    const { environment, queryRegistry } = useMemo(() => getEnvironment(), [getEnvironment]);

    return (
      <RelayEnvironmentProvider environment={environment}>
        <TransportProvider
          onQueryEvent={(event) =>
            event.type === 'started'
              ? queryRegistry.onQueryStarted(event)
              : queryRegistry.onQueryProgress(event)
          }
          onStreamClosed={() => queryRegistry.onStreamClosed(environment)}
          registerTrackQuery={(callback) => {
            queryRegistry.subscribeToQueries({ next: callback });
          }}
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
