import { createFileRoute } from '@tanstack/react-router';
import relay from 'react-relay';
import type { routesIndexQuery } from '../__generated__/routesIndexQuery.graphql';
import { loggingMiddleware } from '#@/utils/loggingMiddleware.js';
const { graphql, usePreloadedQuery } = relay;
import { createLink } from '@tanstack/react-router';
import { Link as HeroUILink } from '@heroui/react';
import { Fragment } from 'react/jsx-runtime';
import { nanoid } from 'nanoid';

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

const Link = createLink(HeroUILink);

export const Route = createFileRoute('/')({
  component: Home,
  loader: ({ context }) => {
    const preloadedQuery = context.preloadQuery<routesIndexQuery>(query, {});
    return { preloadedQuery };
  },
});

function Home() {
  const { preloadedQuery } = Route.useLoaderData();
  const data = usePreloadedQuery<routesIndexQuery>(query, preloadedQuery);
  const edges = data.films?.edges ?? [];
  return (
    <>
      <h1>Star Wars Films</h1>
      <div className="p-8 flex flex-col gap-4 w-full mx-auto">
        {edges.map((edge) => {
          return (
            <Fragment key={edge?.cursor ?? `missing-${nanoid()}`}>
              {edge?.node?.id ? (
                <Link to="/film/$id" params={{ id: edge.node.id }}>
                  {edge.node.title}
                </Link>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
