import type { QueryRegistry } from "#@/query-cache.js";
import type { RelayMiddleware, ResponseTransform } from "#@/middleware/types.js";
import type { ExecuteFunction } from "relay-runtime";

export interface RelayNetworkConfig {
  url: string;
  queryRegistry: QueryRegistry;
  middleware?: RelayMiddleware[];
  responseTransforms?: ResponseTransform[];
}

export interface StartSsrRelayNetwork {
  execute: ExecuteFunction;
}

export type CreateNetworkInit = Omit<RelayNetworkConfig, "queryRegistry">;
