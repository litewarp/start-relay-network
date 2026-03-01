import { debugHydration } from "../debug.js";
import { getQueryRegistry } from "../environment.js";

import type { PreloadedQuery } from "../preload/types.js";

import { createSerializationAdapter } from "@tanstack/react-router";
import { type Environment, type OperationType } from "relay-runtime";

const dehydratedOmittedKeys = new Set([
  "dispose",
  "environment",
  "isDisposed",
  "networkError",
  "releaseQuery",
  "source",
]);

export type DehydratedPreloadedQuery<TQuery extends OperationType> = Omit<
  PreloadedQuery<TQuery>,
  | "dispose"
  | "environment"
  | "isDisposed"
  | "networkError"
  | "releaseQuery"
  | "source"
>;

const isStreamedPreloadedQuery = <TQuery extends OperationType>(
  value: unknown,
): value is PreloadedQuery<TQuery> => {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.keys(value).some((key) => dehydratedOmittedKeys.has(key))
  );
};

export function dehydratePreloadedQuery<TQuery extends OperationType>(
  preloadedQuery: PreloadedQuery<TQuery>,
): DehydratedPreloadedQuery<TQuery> {
  return {
    kind: preloadedQuery.kind,
    environmentProviderOptions: preloadedQuery.environmentProviderOptions,
    fetchKey: preloadedQuery.fetchKey,
    fetchPolicy: preloadedQuery.fetchPolicy,
    networkCacheConfig: preloadedQuery.networkCacheConfig,
    id: preloadedQuery.id,
    name: preloadedQuery.name,
    variables: preloadedQuery.variables,
    $__relay_queryRef: preloadedQuery.$__relay_queryRef,
  } as DehydratedPreloadedQuery<TQuery>;
}

export function hydratePreloadedQuery<TQuery extends OperationType>(
  environment: Environment,
  dehydratedQuery: DehydratedPreloadedQuery<TQuery>,
): PreloadedQuery<TQuery> {
  let isDisposed = false;
  let isReleased = false;

  debugHydration("Hydrating query");
  // if we have a ref, add it to the registry
  if (dehydratedQuery.$__relay_queryRef) {
    const queryRegistry = getQueryRegistry(environment);
    queryRegistry.build(
      dehydratedQuery.$__relay_queryRef.operation,
    );
  }
  return {
    kind: dehydratedQuery.kind,
    dispose() {
      if (isDisposed) {
        return;
      }
      isDisposed = true;
    },
    get isDisposed(): boolean {
      return isDisposed || isReleased;
    },
    environment,
    environmentProviderOptions: dehydratedQuery.environmentProviderOptions,
    fetchKey: dehydratedQuery.fetchKey,
    fetchPolicy: dehydratedQuery.fetchPolicy,
    networkCacheConfig: dehydratedQuery.networkCacheConfig,
    id: dehydratedQuery.id,
    name: dehydratedQuery.name,
    variables: dehydratedQuery.variables,
    $__relay_queryRef: dehydratedQuery.$__relay_queryRef,
  } as unknown as PreloadedQuery<TQuery>;
}

export function createPreloadedQuerySerializer<TQuery extends OperationType>(
  environment: Environment,
) {
  return createSerializationAdapter<
    PreloadedQuery<TQuery>,
    DehydratedPreloadedQuery<TQuery>
  >({
    key: "relay-ssr-preloaded-query",
    test: isStreamedPreloadedQuery,
    toSerializable: (value) => {
      return dehydratePreloadedQuery(value);
    },
    fromSerializable: (value) => {
      return hydratePreloadedQuery(environment, value);
    },
  });
}
