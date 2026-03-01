import type { CacheConfig, GraphQLResponse, RequestParameters, Variables } from 'relay-runtime';

export interface RequestContext {
  request: RequestParameters;
  variables: Variables;
  cacheConfig: CacheConfig;
  fetchOptions: RequestInit;
  url: string;
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
