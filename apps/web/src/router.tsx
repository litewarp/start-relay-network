import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary';
import { NotFound } from './components/NotFound';
import { integrateRelayWithRouter } from '@litewarp/start-relay-network';
import { getRelayEnvironment } from './lib/relay/environment';

export function getRouter() {
  const { environment, preloadQuery } = getRelayEnvironment();

  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
    context: {
      environment,
      preloadQuery,
    },
  });

  integrateRelayWithRouter({
    router,
    environment,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
