import { createServerFetchFn } from './network/server.js';
import { createClientFetchFn } from './network/client.js';
import { createQueryRegistry, type QueryRegistry } from './query-cache.js';
import { createServerPreloader } from './preload/server.js';
import { createClientPreloader } from './preload/client.js';

import type { RelayMiddleware, ResponseTransform } from './middleware/types.js';
import type { GetFetchOptionsFn } from './network/types.js';

import { Environment } from 'relay-runtime';

const QUERY_REGISTRY_KEY = Symbol('start-relay-queryRegistry');

/**
 * Shape of the `options` bag we attach to the Relay Environment.
 * Kept internal — consumers use `getQueryRegistry(env)` to access.
 */
interface RelayEnvironmentOptions {
  [QUERY_REGISTRY_KEY]: QueryRegistry;
}

/**
 * Type-safe accessor for the environment's options bag.
 * Centralises the single unavoidable cast in one place.
 */
function getOptions(environment: Environment): RelayEnvironmentOptions | undefined {
  return environment.options as RelayEnvironmentOptions | undefined;
}

function setOptions(environment: Environment, opts: RelayEnvironmentOptions): void {
  environment.options = opts;
}

export interface CreateRelayEnvironmentOptions {
  url: string;
  getFetchOptions: GetFetchOptionsFn;
  middleware?: RelayMiddleware[];
  responseTransforms?: ResponseTransform[];
  /** Explicitly set server/client mode. If omitted, uses `typeof window === 'undefined'`. */
  isServer?: boolean;
}

export function createRelayEnvironment(options: CreateRelayEnvironmentOptions) {
  const {
    url,
    getFetchOptions,
    middleware,
    responseTransforms,
    isServer = typeof window === 'undefined',
  } = options;

  const queryRegistry = createQueryRegistry({ isServer });
  const networkConfig = { url, getFetchOptions, queryRegistry, middleware, responseTransforms };

  const network = isServer
    ? createServerFetchFn(networkConfig)
    : createClientFetchFn(networkConfig);

  const environment = new Environment({
    network,
    isServer,
  });

  // Attach the registry to the environment for internal access
  attachQueryRegistry(environment, queryRegistry);

  const preloadQuery = isServer
    ? createServerPreloader(environment)
    : createClientPreloader(environment);

  return { environment, preloadQuery };
}

/**
 * Attach a QueryRegistry to a Relay Environment's `options` bag.
 */
export function attachQueryRegistry(environment: Environment, registry: QueryRegistry): void {
  const existing = getOptions(environment);
  setOptions(environment, {
    ...existing,
    [QUERY_REGISTRY_KEY]: registry,
  });
}

/**
 * Retrieve the QueryRegistry from a Relay Environment.
 * Throws if not found (environment was not created via `createRelayEnvironment`).
 */
export function getQueryRegistry(environment: Environment): QueryRegistry {
  const registry = getOptions(environment)?.[QUERY_REGISTRY_KEY];
  if (!registry) {
    throw new Error(
      'QueryRegistry not found on Environment. ' +
      'Did you create the environment with createRelayEnvironment()?'
    );
  }
  return registry;
}
