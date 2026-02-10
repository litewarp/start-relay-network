import debug from 'debug';

/**
 * Debug logger configuration for start-relay-network package
 *
 * Enable debug logging by setting the DEBUG environment variable:
 *
 * - `DEBUG=start-relay-network:*` - Enable all logs
 * - `DEBUG=start-relay-network:fetch` - Enable fetch logs only
 * - `DEBUG=start-relay-network:network:*` - Enable all network logs
 * - `DEBUG=start-relay-network:*,-start-relay-network:transport` - Enable all except transport logs
 *
 * Example usage:
 * ```bash
 * DEBUG=start-relay-network:* npm run dev
 * ```
 */

// Core subsystems
export const debugFetch = debug('start-relay-network:fetch');
export const debugPreload = debug('start-relay-network:preload');
export const debugCache = debug('start-relay-network:cache');

// Network layer
export const debugNetwork = debug('start-relay-network:network');
export const debugNetworkClient = debug('start-relay-network:network:client');
export const debugNetworkServer = debug('start-relay-network:network:server');

// Transport layer
export const debugTransport = debug('start-relay-network:transport');
export const debugTransportClient = debug('start-relay-network:transport:client');
export const debugTransportServer = debug('start-relay-network:transport:server');
export const debugHydration = debug('start-relay-network:hydration');

// Warning and error loggers (always enabled unless explicitly disabled)
export const warnRelay = debug('start-relay-network:warn');
export const errorRelay = debug('start-relay-network:error');

// Enable warn and error by default
warnRelay.enabled = true;
errorRelay.enabled = true;
