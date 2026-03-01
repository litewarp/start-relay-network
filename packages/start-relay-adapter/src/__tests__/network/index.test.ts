import { createRelayEnvironment } from '#@/environment.js';
import { describe, it, expect } from 'vitest';

const config = {
  url: 'http://test.com/graphql',
  getFetchOptions: async () => ({ method: 'POST' as const }),
};

describe('createRelayEnvironment', () => {
  describe('client mode (isServer: false)', () => {
    it('returns an environment', () => {
      const { environment } = createRelayEnvironment({ ...config, isServer: false });
      expect(environment).toBeDefined();
    });

    it('returns a preloadQuery function', () => {
      const { preloadQuery } = createRelayEnvironment({ ...config, isServer: false });
      expect(typeof preloadQuery).toBe('function');
    });
  });

  describe('server mode (isServer: true)', () => {
    it('returns an environment', () => {
      const { environment } = createRelayEnvironment({ ...config, isServer: true });
      expect(environment).toBeDefined();
    });

    it('returns a preloadQuery function', () => {
      const { preloadQuery } = createRelayEnvironment({ ...config, isServer: true });
      expect(typeof preloadQuery).toBe('function');
    });
  });
});
