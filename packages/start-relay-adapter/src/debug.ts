const PREFIX = 'start-relay-network';

function createLogger(namespace: string, alwaysEnabled = false) {
  const tag = `[${namespace}]`;
  const fn = (...args: unknown[]) => {
    if (fn.enabled) console.debug(tag, ...args);
  };
  fn.enabled = alwaysEnabled;
  return fn;
}

// Core subsystems
export const debugFetch = createLogger(`${PREFIX}:fetch`);
export const debugPreload = createLogger(`${PREFIX}:preload`);
export const debugCache = createLogger(`${PREFIX}:cache`);

// Network layer
export const debugNetwork = createLogger(`${PREFIX}:network`);
export const debugNetworkClient = createLogger(`${PREFIX}:network:client`);
export const debugNetworkServer = createLogger(`${PREFIX}:network:server`);

// Transport layer
export const debugTransport = createLogger(`${PREFIX}:transport`);
export const debugTransportClient = createLogger(`${PREFIX}:transport:client`);
export const debugTransportServer = createLogger(`${PREFIX}:transport:server`);
export const debugHydration = createLogger(`${PREFIX}:hydration`);

// Warning and error loggers (always enabled unless explicitly disabled)
export const warnRelay = createLogger(`${PREFIX}:warn`, true);
export const errorRelay = createLogger(`${PREFIX}:error`, true);
