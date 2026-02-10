import type { GetNetworkFn } from '#@/network/types.js';

import { ClientRelayNetwork } from '#@/network/client.js';
import { ServerRelayNetwork } from '#@/network/server.js';

export const createStartRelayNetwork: GetNetworkFn = (opts, isServer) => {
  if (isServer) {
    return new ServerRelayNetwork(opts);
  } else {
    return new ClientRelayNetwork(opts);
  }
};
