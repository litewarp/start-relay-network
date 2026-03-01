import type { EnvironmentProviderOptions, LoadQueryOptions } from "react-relay";

import { debugPreload } from "#@/debug.js";
import relay from "react-relay";
import {
  type Environment,
  type GraphQLTaggedNode,
  type OperationType,
  type VariablesOf,
} from "relay-runtime";

import type { PreloadedQuery } from "./types.js";

export const createClientPreloader = (
  environment: Environment,
) => {
  return <TQuery extends OperationType>(
    request: GraphQLTaggedNode,
    variables: VariablesOf<TQuery>,
    options?: LoadQueryOptions,
    environmentProviderOptions?: EnvironmentProviderOptions,
  ): PreloadedQuery<TQuery> => {
    debugPreload("[client] Preloading query:", request, variables);
    const _preloadedQuery = relay.loadQuery<TQuery>(
      environment,
      request,
      variables,
      options,
      environmentProviderOptions,
    );
    return {
      ..._preloadedQuery,
      $__relay_queryRef: undefined,
    } as unknown as PreloadedQuery<TQuery>;
  };
};

export type ClientPreloadFunction = ReturnType<typeof createClientPreloader>;
