import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestUrl } from '@tanstack/react-start/server';
import { createRelayEnvironment } from '@litewarp/start-relay-network';

const GRAPHQL_PATH = '/api/graphql';

export const getRelayEnvironment = createIsomorphicFn()
  .client(() => createRelayEnvironment({ url: GRAPHQL_PATH, isServer: false }))
  .server(() => {
    // The server fetches from itself, so the relative path must be resolved
    // against the incoming request's origin.
    const url = new URL(GRAPHQL_PATH, getRequestUrl()).href;
    return createRelayEnvironment({ url, isServer: true });
  });
