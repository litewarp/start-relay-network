/**
 * New Exports
 */
export {
  createClientPreloader,
  type ClientPreloadFunction,
  createServerPreloader,
  type ServerPreloadFunction
} from './create-preloader.js';
export {
  createQueryCache,
  queryKeyFromIdAndVariables,
  buildQueryKey,
  buildUniqueKey,
  parseUniqueKey,
  type RelayStartQueryCache
} from './query-cache.js';
export { createStartRelayNetwork } from './network.js';
export * from './network/types.js';

import type { Transport } from '#@/transport/types.js';
import type { AnyRouter } from '@tanstack/react-router';

import { setCoreRouterRelayIntegration, type RouterSsrRelayOptions } from '#@/setup/core.js';
import { RelayProvider } from '#@/transport/relay-provider.jsx';
import { Fragment } from 'react/jsx-runtime';

export function setupRouterRelayIntegration<TRouter extends AnyRouter>(
  opts: Omit<RouterSsrRelayOptions<TRouter>, 'providerContext'>
) {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const providerContext = {} as { transport: Transport };

  setCoreRouterRelayIntegration<TRouter>({ ...opts, providerContext });

  const PreviousInnerWrap = opts.router.options.InnerWrap ?? Fragment;

  opts.router.options.InnerWrap = ({ children }) => {
    return (
      <RelayProvider
        environment={opts.environment}
        queryCache={opts.queryCache}
        context={providerContext}
      >
        <PreviousInnerWrap>{children}</PreviousInnerWrap>
      </RelayProvider>
    );
  };
}
