import { DataTransportContext, WrapRelayProvider } from './wrap-relay-provider.jsx';

import type { QueryCache } from '../query-cache.js';
import type { Transport } from './types.js';
import type { Environment } from 'relay-runtime';

const WrappedRelayProvider = WrapRelayProvider<{
  context: { transport: Transport };
}>((props) => {
  const transport = props.context.transport;

  if ('dispatchRequestStarted' in transport) {
    if (!props.registerDispatchRequestStarted) {
      throw new Error('registerDispatchRequestStarted is required in server');
    }
    props.registerDispatchRequestStarted(transport.dispatchRequestStarted);
  } else {
    if (!props.onQueryEvent || !props.rerunSimulatedQueries) {
      throw new Error('onQueryEvent and rerunSimulatedQueries are required in client');
    }

    transport.onQueryEvent = props.onQueryEvent;
    transport.rerunSimulatedQueries = props.rerunSimulatedQueries;
  }
  return (
    <DataTransportContext.Provider value={transport}>
      {props.children}
    </DataTransportContext.Provider>
  );
});

export function RelayProvider(props: {
  environment: Environment;
  queryCache: QueryCache;
  context: { transport: Transport };
  children: React.ReactNode;
}) {
  return (
    <WrappedRelayProvider
      getEnvironment={() => ({
        environment: props.environment,
        queryCache: props.queryCache
      })}
      context={props.context}
    >
      {props.children}
    </WrappedRelayProvider>
  );
}
