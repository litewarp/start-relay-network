import type { QueryCache } from '#@/query-cache.js';
import type { EnvironmentProviderOptions, LoadQueryOptions } from 'react-relay';

import { debugPreload } from '#@/debug.js';
import relay from 'react-relay';
import {
  type Environment,
  type GraphQLTaggedNode,
  type OperationType,
  type VariablesOf
} from 'relay-runtime';

export const createClientPreloader = (environment: Environment, _queryCache: QueryCache) => {
  return <TQuery extends OperationType>(
    request: GraphQLTaggedNode,
    variables: VariablesOf<TQuery>,
    options?: LoadQueryOptions,
    environmentProviderOptions?: EnvironmentProviderOptions
  ) => {
    debugPreload('[client] Preloading query:', request, variables);
    return relay.loadQuery<TQuery>(
      environment,
      request,
      variables,
      options,
      environmentProviderOptions
    );
  };
};

export type ClientPreloadFunction = ReturnType<typeof createClientPreloader>;
