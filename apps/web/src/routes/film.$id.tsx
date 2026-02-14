import { filmFragment_planets$key } from '#@/__generated__/filmFragment_planets.graphql.js';
import { filmQuery } from '#@/__generated__/filmQuery.graphql.js';
import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import relay from 'react-relay';
const { graphql, useFragment, usePreloadedQuery } = relay;

const query = graphql`
  query filmQuery($id: ID!) {
    filmById(id: $id) @required(action: THROW) {
      id
      title
      ...filmFragment_planets @defer
    }
  }
`;

export const Route = createFileRoute('/film/$id')({
  component: RouteComponent,

  loader: ({ context, params }) => {
    const preloadedQuery = context.preloadQuery<filmQuery>(query, { id: params.id });
    return { preloadedQuery };
  },
});

function RouteComponent() {
  const { preloadedQuery } = Route.useLoaderData();
  const data = usePreloadedQuery<filmQuery>(query, preloadedQuery);
  return (
    <div className="flex flex-col">
      <div>{data.filmById.title}</div>
      <Suspense fallback={'loading...'}>
        <FilmDetails film={data.filmById} />
      </Suspense>
    </div>
  );
}

const fragment = graphql`
  fragment filmFragment_planets on Film {
    filmPlanets {
      totalCount
      edges {
        cursor
        node {
          planet {
            name
          }
        }
      }
    }
  }
`;

const FilmDetails = (props: { film: filmFragment_planets$key }) => {
  const data = useFragment(fragment, props.film);

  const edges = data.filmPlanets.edges ?? [];

  return (
    <div>
      <div>Planets in Film:</div>
      {edges.map((edge) => (
        <div key={edge?.cursor}>{edge?.node?.planet?.name}</div>
      ))}
    </div>
  );
};
