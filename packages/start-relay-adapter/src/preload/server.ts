import { debugPreload } from '../debug.js';

import type { QueryCache } from '../query-cache.js';
import type {
  EnvironmentProviderOptions,
  LoadQueryOptions,
  OperationDescriptor,
  PreloadedQuery
} from 'react-relay';

import relay from 'react-relay';
import runtime, {
  type Environment,
  type GraphQLTaggedNode,
  type OperationType,
  type VariablesOf
} from 'relay-runtime';

const { getRequest, createOperationDescriptor } = runtime;

export interface StreamedPreloadedQuery<
  TQuery extends OperationType
> extends PreloadedQuery<TQuery> {
  $__relay_queryRef: {
    operation: OperationDescriptor;
  };
}

export const createServerPreloader = (environment: Environment, queryCache: QueryCache) => {
  return <TQuery extends OperationType>(
    request: GraphQLTaggedNode,
    variables: VariablesOf<TQuery>,
    options?: LoadQueryOptions,
    environmentProviderOptions?: EnvironmentProviderOptions
  ): StreamedPreloadedQuery<TQuery> => {
    debugPreload('[server] Preloading query:', request, variables);

    // build the operation descriptor
    const req = getRequest(request);
    const operation = createOperationDescriptor(req, variables, options?.networkCacheConfig);

    // store the operation in the queryCache
    queryCache.build(operation);

    const preloadedQuery = relay.loadQuery<TQuery>(
      environment,
      request,
      variables,
      options,
      environmentProviderOptions
    );

    // add the streaming metadata
    return {
      ...preloadedQuery,
      $__relay_queryRef: {
        operation
      }
    };
  };
};

export type ServerPreloadFunction = ReturnType<typeof createServerPreloader>;
