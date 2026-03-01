import type { RelayNetworkConfig } from './types.js';

import { debugNetworkClient } from '#@/debug.js';
import { multipartFetch } from '#@/fetch/refetch.js';
import { applyMiddleware, createResponseTransform } from '#@/middleware/compose.js';
import { queryKeyFromIdAndVariables } from '#@/query-cache.js';
import { coerceError } from '#@/utils.js';
import runtime, {
  type FetchFunction,
  type GraphQLResponse
} from 'relay-runtime';

const { Network, Observable } = runtime;

export function createClientFetchFn(config: RelayNetworkConfig) {
  const { url, queryRegistry, getFetchOptions, middleware = [], responseTransforms = [] } = config;

  const fetchFn: FetchFunction = (request, variables, cacheConfig, _uploadables) => {
    const queryKey = queryKeyFromIdAndVariables(request.id ?? request.cacheID, variables);

    // Check if we have a cached response from SSR hydration
    const query = queryRegistry.get(queryKey);
    if (query) {
      debugNetworkClient('Returning from replay for queryKey:', queryKey);
      return Observable.create<GraphQLResponse>((sink) => {
        const subscription = query.subscribe({
          error: (err: unknown) => sink.error(coerceError(err)),
          complete: () => sink.complete(),
          next: (data) => {
            if (data.type === 'error') {
              sink.error(coerceError(data.error));
            } else if (data.type === 'complete') {
              sink.complete();
            } else if (data.type === 'next') {
              sink.next(data.data);
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      });
    }

    // Fresh fetch — apply request middleware, then stream with response transforms
    return Observable.create<GraphQLResponse>((sink) => {
      getFetchOptions(request, variables, cacheConfig)
        .then(async (baseFetchOptions) => {
          const ctx = await applyMiddleware(middleware, {
            request,
            variables,
            cacheConfig,
            fetchOptions: baseFetchOptions,
            url,
          });

          const transform = createResponseTransform(responseTransforms);

          return multipartFetch({
            url: ctx.url,
            getRequestInit: () => Promise.resolve(ctx.fetchOptions),
            onComplete: () => sink.complete(),
            onError: (error) => sink.error(error),
            onNext: (responses) => {
              const transformed = responses.flatMap(transform);
              transformed.forEach((r) => sink.next(r));
            },
          });
        })
        .catch((err: unknown) => sink.error(coerceError(err)));
    });
  };

  return Network.create(fetchFn);
}
