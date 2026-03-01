import { extendSchema } from 'postgraphile/utils';
import { context } from 'postgraphile/grafast';

declare global {
  namespace Grafast {
    interface Context {
      relayEnvironment: string | undefined;
    }
  }
}

/**
 * Adds an `executionEnvironment` field to the Query type that returns
 * where the GraphQL request originated from (e.g. "server", "client").
 *
 * The value is read from the `relayEnvironment` key in the Grafast context,
 * which is populated from the `X-Relay-Environment` request header in
 * graphile.config.ts.
 */
export const EnvironmentPlugin = extendSchema((build) => {
  const { grafast } = build;
  return {
    typeDefs: /* GraphQL */ `
      extend type Query {
        executionEnvironment: String!
      }
    `,
    objects: {
      Query: {
        plans: {
          executionEnvironment() {
            const $ctx = context();
            return grafast.lambda($ctx.get('relayEnvironment'), (env) =>
              typeof env === 'string' ? env : 'unknown'
            );
          },
        },
      },
    },
  };
});
