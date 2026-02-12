import type { QueryCache } from "#@/query-cache.js";
import type { ExecuteFunction, FetchFunction } from "relay-runtime";

export type GetFetchOptsFn = (
  ...opts: Parameters<FetchFunction>
) => Promise<RequestInit>;

export interface RelayNetworkConfig {
  url: string;
  getFetchOptions: GetFetchOptsFn;
  queryCache: QueryCache;
}

export interface StartSsrRelayNetwork {
  execute: ExecuteFunction;
}

export type GetNetworkFn = (
  opts: RelayNetworkConfig,
  isServer?: boolean,
) => StartSsrRelayNetwork;
