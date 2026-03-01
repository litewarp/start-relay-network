import { debugPreload } from "../debug.js";
import { getQueryRegistry } from "../environment.js";

import type { EnvironmentProviderOptions, LoadQueryOptions } from "react-relay";

import relay from "react-relay";
import runtime, {
  type Environment,
  type GraphQLTaggedNode,
  type OperationType,
  type VariablesOf,
} from "relay-runtime";
import type { PreloadedQuery } from "./types.js";
const { getRequest, createOperationDescriptor } = runtime;

export const createServerPreloader = (
  environment: Environment,
) => {
  const queryRegistry = getQueryRegistry(environment);

  return <TQuery extends OperationType>(
    request: GraphQLTaggedNode,
    variables: VariablesOf<TQuery>,
    options?: LoadQueryOptions,
    environmentProviderOptions?: EnvironmentProviderOptions,
  ): PreloadedQuery<TQuery> => {
    debugPreload("[server] Preloading query:", request, variables);

    // build the operation descriptor
    const req = getRequest(request);
    const operation = createOperationDescriptor(
      req,
      variables,
      options?.networkCacheConfig,
    );

    // store the operation in the queryRegistry
    queryRegistry.build(operation);

    // Always use network-only on the server to ensure fresh data is fetched.
    // The default 'store-or-network' combined with partial rendering policy
    // causes Relay to skip the fetch when client:root exists in the store.
    const serverOptions: LoadQueryOptions = {
      ...options,
      fetchPolicy: "network-only",
    };
    const preloadedQuery = relay.loadQuery<TQuery>(
      environment,
      request,
      variables,
      serverOptions,
      environmentProviderOptions,
    );

    // add the streaming metadata
    return {
      ...preloadedQuery,
      $__relay_queryRef: {
        operation,
      },
    } as unknown as PreloadedQuery<TQuery>;
  };
};

export type ServerPreloadFunction = ReturnType<typeof createServerPreloader>;
