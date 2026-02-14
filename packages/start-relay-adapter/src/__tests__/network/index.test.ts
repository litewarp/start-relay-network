import { createClientNetwork } from '#@/client.js';
import { createServerNetwork } from '#@/server.js';
import { ClientRelayNetwork } from '#@/network/client.js';
import { ServerRelayNetwork } from '#@/network/server.js';
import { describe, it, expect } from 'vitest';

const config = {
  url: 'http://test.com/graphql',
  getFetchOptions: async () => ({ method: 'POST' as const }),
};

describe('createClientNetwork', () => {
  it('returns a ClientRelayNetwork instance', () => {
    const { network } = createClientNetwork(config);
    expect(network).toBeInstanceOf(ClientRelayNetwork);
  });

  it('returns a createPreloader function', () => {
    const { createPreloader } = createClientNetwork(config);
    expect(typeof createPreloader).toBe('function');
  });
});

describe('createServerNetwork', () => {
  it('returns a ServerRelayNetwork instance', () => {
    const { network } = createServerNetwork(config);
    expect(network).toBeInstanceOf(ServerRelayNetwork);
  });

  it('returns a createPreloader function', () => {
    const { createPreloader } = createServerNetwork(config);
    expect(typeof createPreloader).toBe('function');
  });
});
