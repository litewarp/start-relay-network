import type RelayModernEnvironment from "relay-runtime/lib/store/RelayModernEnvironment.js";
import type { RelayStartQueryCache } from "./query-cache.js";
import type { ServerPreloadFunction } from "./preload/server.js";
import type { ClientPreloadFunction } from "./preload/client.js";

export { setupRouterRelayIntegration } from "./setup/setup.js";

export interface StartRelayContext {
  environment: RelayModernEnvironment;
  queryCache: RelayStartQueryCache;
  preloadQuery: ServerPreloadFunction | ClientPreloadFunction;
}

export * from "./network/types.js";
export { createClientNetwork } from "./client.js";
export { createServerNetwork } from "./server.js";
