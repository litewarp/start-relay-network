import { DataTransportContext, WrapRelayProvider } from './wrap-relay-provider.jsx';

import type { QueryRegistry } from '../query-cache.js';
import type { Transport } from './types.js';
import type { Environment } from 'relay-runtime';

const WrappedRelayProvider = WrapRelayProvider<{
  context: { transport: Transport };
}>((props) => {
  const transport = props.context.transport;

  if ('trackQuery' in transport) {
    if (!props.registerTrackQuery) {
      throw new Error('registerTrackQuery is required in server');
    }
    props.registerTrackQuery(transport.trackQuery);
  } else {
    if (!props.onQueryEvent || !props.onStreamClosed) {
      throw new Error('onQueryEvent and onStreamClosed are required in client');
    }

    transport.subscribeToEvents({
      next: props.onQueryEvent,
      complete: props.onStreamClosed,
    });
    transport.onStreamClosed = props.onStreamClosed;
  }
  return (
    <DataTransportContext.Provider value={transport}>
      {props.children}
    </DataTransportContext.Provider>
  );
});

export function RelayProvider(props: {
  environment: Environment;
  queryRegistry: QueryRegistry;
  context: { transport: Transport };
  children: React.ReactNode;
}) {
  return (
    <WrappedRelayProvider
      getEnvironment={() => ({
        environment: props.environment,
        queryRegistry: props.queryRegistry
      })}
      context={props.context}
    >
      {props.children}
    </WrappedRelayProvider>
  );
}
