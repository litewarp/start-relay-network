import type { QueryCache } from '#@/query-cache.js';
import type {
  CacheConfig,
  ExecuteFunction,
  RequestParameters,
  Variables
} from 'relay-runtime';

export type GetRequestInitFn = (
  req: RequestParameters,
  variables: Variables,
  cacheConfig: CacheConfig
) => Promise<RequestInit>;

export interface RelayNetworkConfig {
  url: string;
  getRequestInit: GetRequestInitFn;
  queryCache: QueryCache;
}

export interface StartSsrRelayNetwork {
  execute: ExecuteFunction;
}

export type GetNetworkFn = (
  opts: RelayNetworkConfig,
  isServer?: boolean
) => StartSsrRelayNetwork;
