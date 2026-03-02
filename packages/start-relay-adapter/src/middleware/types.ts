import type { CacheConfig, GraphQLResponse, RequestParameters, Variables } from 'relay-runtime';

export interface RequestContext {
  request: RequestParameters;
  variables: Variables;
  cacheConfig: CacheConfig;
  fetchOptions: RequestInit;
  url: string;
  meta: Record<string, unknown>;
}

/**
 * Request middleware — transforms the RequestContext before the fetch.
 * Run sequentially in order. Can be async.
 */
export type RelayMiddleware = (ctx: RequestContext) => RequestContext | Promise<RequestContext>;

/**
 * Factory that creates a per-request response transform function.
 * Called once per fetch to get a fresh transform, ensuring stateful
 * transforms (like incremental delivery) don't leak state between
 * concurrent requests.
 */
export type ResponseTransform = () => (response: GraphQLResponse) => GraphQLResponse[];

/**
 * Creates a typed middleware function. The generic parameter narrows
 * `ctx.meta` so you get type-safe access to custom properties that
 * middleware adds to the context.
 *
 * @example
 * ```ts
 * const authMiddleware = createMiddleware<{ token: string }>(async (ctx) => ({
 *   ...ctx,
 *   meta: { ...ctx.meta, token: await getToken() },
 *   fetchOptions: {
 *     ...ctx.fetchOptions,
 *     headers: { ...ctx.fetchOptions.headers, Authorization: `Bearer ${token}` },
 *   },
 * }));
 * ```
 */
export function createMiddleware<TMeta extends Record<string, unknown> = Record<string, unknown>>(
  fn: (ctx: RequestContext & { meta: RequestContext['meta'] & TMeta }) =>
    | (RequestContext & { meta: RequestContext['meta'] & TMeta })
    | Promise<RequestContext & { meta: RequestContext['meta'] & TMeta }>
): RelayMiddleware {
  return fn as RelayMiddleware;
}
