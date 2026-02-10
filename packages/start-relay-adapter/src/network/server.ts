import { multipartFetch } from '../fetch/refetch.js';
import { queryKeyFromIdAndVariables, type QueryCache } from '../query-cache.js';

import type { RelayNetworkConfig } from './types.js';

import { debugNetworkServer, errorRelay, warnRelay } from '#@/debug.js';
import runtime, {
  type CacheConfig,
  type ExecuteFunction,
  type FetchFunction,
  type GraphQLResponse
} from 'relay-runtime';

const { Network, Observable } = runtime;

const getAbortSignal = (cacheConfig: CacheConfig): AbortSignal | undefined => {
  const signal = cacheConfig?.metadata?.abortSignal;
  return signal instanceof AbortSignal ? signal : undefined;
};

export class ServerRelayNetwork {
  #url: string;
  #queryCache: QueryCache;
  #fetchFn: FetchFunction;

  public execute: ExecuteFunction;

  constructor({ getRequestInit, url, queryCache }: RelayNetworkConfig) {
    this.#url = url;
    this.#queryCache = queryCache;

    this.#fetchFn = (request, variables, cacheConfig, _uploadables) => {
      debugNetworkServer('Executing request:', request);
      // const forceFetch = cacheConfig?.force ?? false;
      const queryKey = queryKeyFromIdAndVariables(request.id ?? request.cacheID, variables);

      const wrappedGetRequestInit = async () => {
        const res = await getRequestInit(request, variables, cacheConfig);
        const signal = getAbortSignal(cacheConfig);
        return { ...res, signal };
      };
      /**
       * TODO: Handle non-preloaded queries (i.e. one without a loader call)
       */
      const query = this.#queryCache.get(queryKey);
      if (!query) {
        warnRelay(
          `Query with key ${queryKey} not found in cache on server. Fetching as promise`
        );
        return wrappedGetRequestInit()
          .then((init) => fetch(this.#url, init))
          .then((res) => res.json())
          .catch((err) => {
            errorRelay('Error fetching query:', err);
          });
      }

      // subscribe to the query's replay subject to get updates
      this.#queryCache.watchQuery(query);

      debugNetworkServer('Starting multipart fetch for queryKey:', queryKey);

      multipartFetch({
        url: this.#url,
        getRequestInit: () => wrappedGetRequestInit(),
        onComplete: () => query.complete(),
        onError: (error) => query.error(error.message),
        onNext: (responses) => responses.forEach((r) => query.next(r))
      }).catch((e) => query.error(e.message));

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
    const network = Network.create(this.#fetchFn);
    this.execute = network.execute;
  }
}
