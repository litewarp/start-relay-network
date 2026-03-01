import type { QueryRegistry } from "#@/query-cache.js";
import type { RelayMiddleware, ResponseTransform } from "#@/middleware/types.js";
import type { ExecuteFunction, FetchFunction } from "relay-runtime";

export type GetFetchOptionsFn = (
  ...opts: Parameters<FetchFunction>
) => Promise<RequestInit>;

export interface RelayNetworkConfig {
  url: string;
  getFetchOptions: GetFetchOptionsFn;
  queryRegistry: QueryRegistry;
  middleware?: RelayMiddleware[];
  responseTransforms?: ResponseTransform[];
}

export interface StartSsrRelayNetwork {
  execute: ExecuteFunction;
}

export type CreateNetworkInit = Omit<RelayNetworkConfig, "queryRegistry">;
