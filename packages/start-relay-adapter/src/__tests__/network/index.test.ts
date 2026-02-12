import { createStartRelayNetwork } from '#@/network.js';
import { ClientRelayNetwork } from '#@/network/client.js';
import { ServerRelayNetwork } from '#@/network/server.js';
import { QueryCache } from '#@/query-cache.js';
import { describe, it, expect } from 'vitest';

describe('createStartRelayNetwork', () => {
  const config = {
    url: 'http://test.com/graphql',
    getRequestInit: async () => ({ method: 'POST' as const }),
    queryCache: new QueryCache()
  };

  it('returns ServerRelayNetwork when isServer is true', () => {
    const network = createStartRelayNetwork(config, true);
    expect(network).toBeInstanceOf(ServerRelayNetwork);
  });

  it('returns ClientRelayNetwork when isServer is false', () => {
    const network = createStartRelayNetwork(config, false);
    expect(network).toBeInstanceOf(ClientRelayNetwork);
  });

  it('returns ClientRelayNetwork when isServer is undefined', () => {
    const network = createStartRelayNetwork(config);
    expect(network).toBeInstanceOf(ClientRelayNetwork);
  });
});
