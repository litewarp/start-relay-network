import type { RelayMiddleware, RequestContext, ResponseTransform } from './types.js';
import type { GraphQLResponse } from 'relay-runtime';

/**
 * Runs request middleware sequentially, threading the context through each.
 */
export async function applyMiddleware(
  middlewares: RelayMiddleware[],
  ctx: RequestContext
): Promise<RequestContext> {
  let current = ctx;
  for (const mw of middlewares) {
    current = await mw(current);
  }
  return current;
}

/**
 * Creates a composed response transform from an array of factories.
 * Each factory is called once to produce a fresh transform for a single
 * fetch lifecycle (important for stateful transforms).
 */
export function createResponseTransform(
  factories: ResponseTransform[]
): (response: GraphQLResponse) => GraphQLResponse[] {
  const transforms = factories.map((factory) => factory());
  return (response: GraphQLResponse) => {
    let results: GraphQLResponse[] = [response];
    for (const transform of transforms) {
      results = results.flatMap(transform);
    }
    return results;
  };
}
