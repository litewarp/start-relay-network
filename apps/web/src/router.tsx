import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import {
  initializeRelayEnvironment,
  setupRouterRelayIntegration,
} from "@litewarp/start-relay-network";

export function getRouter() {
  const { queryCache, environment, preloadQuery } = initializeRelayEnvironment({
    url: "http://localhost:4000/graphql",
    getFetchOptions: async (request, variables, cacheConfig) => {
      const signal =
        cacheConfig?.metadata?.abortSignal instanceof AbortSignal
          ? cacheConfig.metadata.abortSignal
          : undefined;
      return {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: request.text,
          variables,
        }),
        signal,
      };
    },
  });

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
    context: {
      queryCache,
      environment,
      preloadQuery,
    },
  });

  setupRouterRelayIntegration({
    router,
    environment,
    queryCache,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
