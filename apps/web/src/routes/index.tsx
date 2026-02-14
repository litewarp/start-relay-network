import { createFileRoute } from '@tanstack/react-router';
import relay from 'react-relay';
import type { routesIndexQuery } from '../__generated__/routesIndexQuery.graphql';
import { loggingMiddleware } from '#@/utils/loggingMiddleware.js';
const { graphql, usePreloadedQuery } = relay;

const query = graphql`
  query routesIndexQuery {
    films(first: 10) {
      totalCount
      edges {
        cursor
        node {
          id
          title
        }
      }
    }
  }
`;

export const Route = createFileRoute('/')({
  component: Home,
  loader: ({ context }) => {
    const preloadedQuery = context.preloadQuery<routesIndexQuery>(query, {});
    return { preloadedQuery };
  },
  server: {
    middleware: [loggingMiddleware],
  },
});

function Home() {
  const { preloadedQuery } = Route.useLoaderData();
  const data = usePreloadedQuery<routesIndexQuery>(query, preloadedQuery);
  return (
    <div className="p-2">
      <h3>Welcome Home!!!</h3>
      <p>Data from GraphQL: {JSON.stringify(data)}</p>
    </div>
  );
}
