const PREFIX = 'start-relay-network';

function createLogger(namespace: string, alwaysEnabled = false) {
  const tag = `[${namespace}]`;
  const fn = (...args: unknown[]) => {
    if (fn.enabled) console.debug(tag, ...args);
  };
  fn.enabled = alwaysEnabled;
  return fn;
}

// Network layer
export const debugNetworkClient = createLogger(`${PREFIX}:network:client`);
export const debugNetworkServer = createLogger(`${PREFIX}:network:server`);

// Transport layer
export const debugTransportClient = createLogger(`${PREFIX}:transport:client`);

// Hydration
export const debugHydration = createLogger(`${PREFIX}:hydration`);

// Preloading
export const debugPreload = createLogger(`${PREFIX}:preload`);

// Warning and error loggers (always enabled)
export const warnRelay = createLogger(`${PREFIX}:warn`, true);
export const errorRelay = createLogger(`${PREFIX}:error`, true);
