import { createFileRoute } from "@tanstack/react-router";
import relay from "react-relay";
import type { routesIndexQuery } from "../__generated__/routesIndexQuery.graphql";
const { graphql, usePreloadedQuery } = relay;

const query = graphql`
  query routesIndexQuery {
    id
  }
`;

export const Route = createFileRoute("/")({
  component: Home,
  // @ts-expect-error serialization adapter handles PreloadedQuery at runtime
  loader: ({ context }) => {
    const preloadedQuery = context.preloadQuery<routesIndexQuery>(query, {});
    return { preloadedQuery };
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
