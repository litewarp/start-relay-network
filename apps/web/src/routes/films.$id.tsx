import { createFileRoute } from "@tanstack/react-router";
import relay from "react-relay";

const { graphql } = relay;

const query = graphql`
  query filmsByIdQuery($id: ID!) {
    film(id: $id) {
      id
      title
      producer
      ...filmsByIdFragment @defer()
    }
  }
`;

export const Route = createFileRoute("/films/$id")({
  component: RouteComponent,
});

const fragment = graphql`
  fragment filmsByIdFragment on Film {
    filmPlanetsByFilmId {
      totalCount
      edges {
        node {
          id
          planetByPlanetId {
            id
            name
          }
        }
      }
    }
  }
`;

function RouteComponent() {
  return <div>Hello "/character/$id"!</div>;
}
