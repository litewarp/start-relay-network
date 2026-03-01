import type RelayModernEnvironment from "relay-runtime/lib/store/RelayModernEnvironment.js";
import type { ServerPreloadFunction } from "./preload/server.js";
import type { ClientPreloadFunction } from "./preload/client.js";

// Main entry point
export { createRelayEnvironment, getQueryRegistry } from "./environment.js";
export type { CreateRelayEnvironmentOptions } from "./environment.js";

// Router integration
export { integrateRelayWithRouter } from "./setup/setup.js";

// Middleware types
export type { RelayMiddleware, ResponseTransform, RequestContext } from "./middleware/types.js";

// Preload types
export type { PreloadedQuery } from "./preload/types.js";

// Network types (for advanced use)
export type { GetFetchOptionsFn, CreateNetworkInit } from "./network/types.js";

// Router context type
export interface RelayRouterContext {
  environment: RelayModernEnvironment;
  preloadQuery: ServerPreloadFunction | ClientPreloadFunction;
}

/** @deprecated Use `RelayRouterContext` instead */
export type StartRelayContext = RelayRouterContext;

/** @deprecated Use `integrateRelayWithRouter` instead */
export { setupRouterRelayIntegration } from "./setup/setup.js";
