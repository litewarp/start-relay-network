import { createPreloadedQuerySerializer } from '../transport/hydration.js';
import { transportSerializationAdapter } from '../transport/serialization-adapter.js';

import type { Transport } from '#@/transport/types.js';
import type { AnyRouter } from '@tanstack/react-router';

import { ServerTransport } from '#@/transport/server.js';
import { RecordSource, type Environment } from 'relay-runtime';

export type RouterRelayOptions<TRouter extends AnyRouter> = {
  router: TRouter;
  environment: Environment;
  providerContext: { transport: Transport };
  /**
   * If `true`, the QueryClient will handle errors thrown by `redirect()` inside of mutations and queries.
   *
   * @default true
   * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/api/router/redirectFunction)
   */
  handleRedirects?: boolean;
};

export function configureRouterRelay<TRouter extends AnyRouter>(
  options: RouterRelayOptions<TRouter>
) {
  const { router, environment, providerContext } = options;

  const ogHydrate = router.options.hydrate;
  const ogDehydrate = router.options.dehydrate;

  if (router.isServer) {
    const relayTransport = new ServerTransport();
    providerContext.transport = relayTransport;

    router.options.dehydrate = async () => {
      router.serverSsr!.onRenderFinished(() => relayTransport.drainAndClose());
      const ogDehydrated = await ogDehydrate?.();
      return {
        ...ogDehydrated,
        recordSource: environment.getStore().getSource().toJSON(),
        relayTransport
      };
    };
  } else {
    router.options.hydrate = (dehydratedState) => {
      providerContext.transport = dehydratedState.relayTransport;
      if (dehydratedState.recordSource) {
        environment.getStore().publish(new RecordSource(dehydratedState.recordSource));
      }
      return ogHydrate?.(dehydratedState);
    };
  }

  router.options.serializationAdapters = [
    ...(router.options.serializationAdapters ?? []),
    createPreloadedQuerySerializer(environment),
    transportSerializationAdapter
  ];
}
