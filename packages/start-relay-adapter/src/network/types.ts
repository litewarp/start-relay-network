import type { QueryCache } from "#@/query-cache.js";
import type { ExecuteFunction, FetchFunction } from "relay-runtime";

export type GetFetchOptionsFn = (
  ...opts: Parameters<FetchFunction>
) => Promise<RequestInit>;

export interface RelayNetworkConfig {
  url: string;
  getFetchOptions: GetFetchOptionsFn;
  queryCache: QueryCache;
}

export interface StartSsrRelayNetwork {
  execute: ExecuteFunction;
}

export type GetNetworkFn = (
  opts: RelayNetworkConfig,
  isServer?: boolean,
) => StartSsrRelayNetwork;

export type CreateNetworkInit = Omit<RelayNetworkConfig, "queryCache">;
