import { createIsomorphicFn } from "@tanstack/react-start";
import { createRelayEnvironment } from "@litewarp/start-relay-network";
import { grafastRelayTransform } from "@litewarp/start-relay-network/transforms/grafast-relay";

function createConfig(isServer: boolean) {
  return {
    url: "http://localhost:4000/graphql",
    getFetchOptions: async (request: { text: string | null | undefined }, variables: Record<string, unknown>) => {
      return {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Relay-Environment": isServer ? "server" : "client",
        },
        body: JSON.stringify({
          query: request.text,
          variables,
        }),
      };
    },
    responseTransforms: [grafastRelayTransform],
    isServer,
  };
}

export const getRelayEnvironment = createIsomorphicFn()
  .client(() => createRelayEnvironment(createConfig(false)))
  .server(() => createRelayEnvironment(createConfig(true)));
