import type { RelayNetworkConfig } from './types.js';

import { debugNetworkClient } from '#@/debug.js';
import { multipartFetch } from '#@/fetch/refetch.js';
import { queryKeyFromIdAndVariables, type QueryCache } from '#@/query-cache.js';
import { coerceError } from '#@/utils.js';
import runtime, {
  type ExecuteFunction,
  type FetchFunction,
  type GraphQLResponse
} from 'relay-runtime';

const { Network, Observable } = runtime;

export class ClientRelayNetwork {
  #url: string;
  #queryCache: QueryCache;
  #fetchFn: FetchFunction;

  public execute: ExecuteFunction;

  constructor(config: RelayNetworkConfig) {
    this.#url = config.url;
    this.#queryCache = config.queryCache;

    this.#fetchFn = (request, variables, cacheConfig, _uploadables) => {
      // const forceFetch = cacheConfig?.force ?? false;

      // TODO: handle abort signal properly
      // const signal =
      //   cacheConfig?.metadata?.signal && cacheConfig?.metadata?.signal instanceof AbortSignal
      //     ? cacheConfig.metadata.signal
      //     : undefined;
      //

      const queryKey = queryKeyFromIdAndVariables(request.id ?? request.cacheID, variables);

      // if we are on the client, check to see if we have a cached response
      const query = this.#queryCache.get(queryKey);
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
        // otherwise fetch as normal
      } else {
        return Observable.create<GraphQLResponse>((sink) => {
          multipartFetch({
            url: this.#url,
            getRequestInit: () => config.getFetchOptions(request, variables, cacheConfig),
            onComplete: () => sink.complete(),
            onError: (error) => sink.error(error),
            onNext: (responses) => responses.forEach((r) => sink.next(r))
          }).catch((err: unknown) => sink.error(coerceError(err)));
        });
      }
    };
    const network = Network.create(this.#fetchFn);
    this.execute = network.execute;
  }
}
