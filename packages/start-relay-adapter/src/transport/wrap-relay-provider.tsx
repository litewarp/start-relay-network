import type {
  TransportProviderComponent
} from './types.js';

import { getQueryRegistry } from '#@/environment.js';
import { useMemo } from 'react';
import relay from 'react-relay';
import { Environment } from 'relay-runtime';

const { RelayEnvironmentProvider } = relay;

export type GetEnvironmentFn = () => Environment;

export type WrappedRelayProviderProps<P> = {
  getEnvironment: GetEnvironmentFn;
  children: React.ReactNode;
} & P;

export function WrapRelayProvider<P>(
  TransportProvider: TransportProviderComponent<P>
) {
  const WrappedRelayProvider = (props: WrappedRelayProviderProps<P>) => {
    const { getEnvironment, children, ...extraProps } = props;

    const environment = useMemo(() => getEnvironment(), [getEnvironment]);
    const queryRegistry = useMemo(() => getQueryRegistry(environment), [environment]);

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
