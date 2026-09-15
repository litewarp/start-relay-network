import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';

const startHandler = createStartHandler(defaultStreamHandler);

let graphqlHandler:
  | ((req: Request, requestContext?: Grafast.RequestContext) => Promise<Response>)
  | null = null;

async function getGraphqlHandler() {
  if (!graphqlHandler) {
    const { pgl } = await import('./pgl.js');
    const { createHandler } = await import('./graphile-handler.js');
    const schema = await pgl.getSchema();
    const resolvedPreset = pgl.getResolvedPreset();
    graphqlHandler = createHandler({ schema, resolvedPreset });
  }
  return graphqlHandler;
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === '/api/graphql' && request.method === 'POST') {
      const handler = await getGraphqlHandler();
      const relayEnvironment = request.headers.get('x-relay-environment') ?? undefined;
      return handler(request, { relayEnvironment });
    }
    return startHandler(request);
  },
};
