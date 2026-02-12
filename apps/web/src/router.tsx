import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { setupRouterRelayIntegration } from "@litewarp/start-relay-network";
import { createRelayEnvironment } from "./lib/relay/environment";

export function getRouter() {
  const { environment, preloadQuery, queryCache } = createRelayEnvironment();

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
    context: {
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
