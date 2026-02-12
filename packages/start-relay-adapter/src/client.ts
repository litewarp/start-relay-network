import type RelayModernEnvironment from "relay-runtime/lib/store/RelayModernEnvironment";
import { ClientRelayNetwork } from "./network/client";
import type { CreateNetworkInit } from "./network/types";
import { createQueryCache } from "./query-cache";
import { createClientPreloader } from "./preload/client";

export const createClientNetwork = (input: CreateNetworkInit) => {
  const queryCache = createQueryCache({ isServer: false });
  const network = new ClientRelayNetwork({
    ...input,
    queryCache,
  });
  const createPreloader = (environment: RelayModernEnvironment) =>
    createClientPreloader(environment, queryCache);

  return { network, createPreloader, queryCache };
};
