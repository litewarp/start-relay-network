import {
  createClientPreloader,
  createServerPreloader,
} from "#@/create-preloader.js";
import { createStartRelayNetwork } from "#@/network.js";
import { createQueryCache } from "#@/query-cache.js";
import { createIsomorphicFn } from "@tanstack/react-start";
import type { EnvironmentConfig, FetchFunction } from "relay-runtime";
import runtime from "relay-runtime";

const { Environment } = runtime;

interface StartRelayEnvironmentConfig {
  url: string;
  getFetchOptions: (...opts: Parameters<FetchFunction>) => Promise<RequestInit>;
  environmentOptions?: Omit<EnvironmentConfig, "network">;
}

export const initializeRelayEnvironment = createIsomorphicFn()
  .client((config: StartRelayEnvironmentConfig) => {
    const queryCache = createQueryCache({ isServer: false });
    const environment = new Environment({
      network: createStartRelayNetwork({
        url: config.url,
        getFetchOptions: config.getFetchOptions,
        queryCache,
      }),
    });
    const preloadQuery = createClientPreloader(environment, queryCache);
    return { environment, preloadQuery, queryCache };
  })
  .server((config: StartRelayEnvironmentConfig) => {
    const queryCache = createQueryCache({ isServer: true });
    const environment = new Environment({
      ...config.environmentOptions,
      network: createStartRelayNetwork({
        url: config.url,
        getFetchOptions: config.getFetchOptions,
        queryCache,
      }),
    });
    const preloadQuery = createServerPreloader(environment, queryCache);
    return { environment, queryCache, preloadQuery };
  });
