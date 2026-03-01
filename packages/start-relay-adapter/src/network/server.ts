import { multipartFetch } from '../fetch/refetch.js';
import { applyMiddleware, createResponseTransform } from '../middleware/compose.js';
import { queryKeyFromIdAndVariables } from '../query-cache.js';

import type { RelayNetworkConfig } from './types.js';

import { debugNetworkServer } from '#@/debug.js';
import runtime, {
  type CacheConfig,
  type FetchFunction,
  type GraphQLResponse
} from 'relay-runtime';

const { Network, Observable } = runtime;

const getAbortSignal = (cacheConfig: CacheConfig): AbortSignal | undefined => {
  const signal = cacheConfig?.metadata?.abortSignal;
  return signal instanceof AbortSignal ? signal : undefined;
};

export function createServerFetchFn(config: RelayNetworkConfig) {
  const { getFetchOptions, url, queryRegistry, middleware = [], responseTransforms = [] } = config;

  const fetchFn: FetchFunction = (request, variables, cacheConfig, _uploadables) => {
    debugNetworkServer('Executing request:', request);
    const queryKey = queryKeyFromIdAndVariables(request.id ?? request.cacheID, variables);

    const query = queryRegistry.get(queryKey);
    if (!query) {
      debugNetworkServer(
        'Query not preloaded — skipping server fetch for queryKey:',
        queryKey
      );
      return Observable.create<GraphQLResponse>(() => {});
    }

    queryRegistry.watchQuery(query);

    debugNetworkServer('Starting fetch for queryKey:', queryKey);

    const signal = getAbortSignal(cacheConfig);

    // Build context, apply request middleware, then fetch with streaming
    getFetchOptions(request, variables, cacheConfig)
      .then(async (baseFetchOptions) => {
        const ctx = await applyMiddleware(middleware, {
          request,
          variables,
          cacheConfig,
          fetchOptions: { ...baseFetchOptions, signal },
          url,
        });

        // Create a per-request response transform pipeline
        const transform = createResponseTransform(responseTransforms);

        return multipartFetch({
          url: ctx.url,
          getRequestInit: () => Promise.resolve(ctx.fetchOptions),
          onNext: (responses) => {
            const transformed = responses.flatMap(transform);
            transformed.forEach((r) => query.next(r));
          },
          onComplete: () => query.complete(),
          onError: (error) => query.error(error.message),
        });
      })
      .catch((e) => query.error(e instanceof Error ? e.message : String(e)));

    return Observable.create<GraphQLResponse>((sink) => {
      query.subscribe({
        next: (event) => {
          switch (event.type) {
            case 'next':
              debugNetworkServer('Received next event for queryKey:', queryKey, event.data);
              sink.next(event.data);
              break;
            case 'error':
              sink.error(new Error(JSON.stringify(event.error)));
              break;
            case 'complete':
              sink.complete();
              break;
          }
        },
        error: (err) => sink.error(err),
        complete: () => sink.complete()
      });
    });
  };

  return Network.create(fetchFn);
}
