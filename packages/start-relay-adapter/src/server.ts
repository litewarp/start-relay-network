import { createQueryCache } from "./query-cache";
import { ServerRelayNetwork } from "./network/server";
import type { CreateNetworkInit } from "./network/types";
import type RelayModernEnvironment from "relay-runtime/lib/store/RelayModernEnvironment";
import { createServerPreloader } from "./preload/server.js";

export function createServerNetwork(input: CreateNetworkInit) {
  const queryCache = createQueryCache({ isServer: true });
  const network = new ServerRelayNetwork({
    ...input,
    queryCache,
  });
  const createPreloader = (environment: RelayModernEnvironment) =>
    createServerPreloader(environment, queryCache);

  return { network, createPreloader, queryCache };
}
