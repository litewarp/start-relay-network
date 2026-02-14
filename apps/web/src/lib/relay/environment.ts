import { createIsomorphicFn } from "@tanstack/react-start";
import {
  createClientNetwork,
  createServerNetwork,
} from "@litewarp/start-relay-network";
import type { CreateNetworkInit } from "@litewarp/start-relay-network";
import { Environment } from "relay-runtime";

const config: CreateNetworkInit = {
  url: "http://localhost:4000/graphql",
  getFetchOptions: async (request, variables, cacheConfig) => {
    const signal =
      cacheConfig?.metadata?.abortSignal instanceof AbortSignal
        ? cacheConfig.metadata.abortSignal
        : undefined;
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: request.text,
        variables,
      }),
      signal,
    };
  },
};

export const createRelayEnvironment = createIsomorphicFn()
  .client(() => {
    const { network, createPreloader, queryCache } = createClientNetwork(config);
    const environment = new Environment({
      network,
      isServer: false,
    });
    return {
      environment,
      preloadQuery: createPreloader(environment),
      queryCache,
    };
  })
  .server(() => {
    const { network, createPreloader, queryCache } = createServerNetwork(config);
    const environment = new Environment({
      network,
      isServer: true,
    });
    return {
      environment,
      preloadQuery: createPreloader(environment),
      queryCache,
    };
  });
