import { createIsomorphicFn } from "@tanstack/react-start";
import { createRelayEnvironment } from "@litewarp/start-relay-network";
import { grafastRelayTransform } from "@litewarp/start-relay-network/transforms/grafast-relay";

function createConfig(isServer: boolean) {
  return {
    url: "http://localhost:4000/graphql",
    responseTransforms: [grafastRelayTransform],
    isServer,
  };
}

export const getRelayEnvironment = createIsomorphicFn()
  .client(() => createRelayEnvironment(createConfig(false)))
  .server(() => createRelayEnvironment(createConfig(true)));
