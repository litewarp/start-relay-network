import { createIsomorphicFn } from "@tanstack/react-start";
import {
  createRelayEnvironment,
  incrementalDeliveryTransform,
} from "@litewarp/start-relay-network";

const config = {
  url: "http://localhost:4000/graphql",
  getFetchOptions: async (request: { text: string | null | undefined }, variables: Record<string, unknown>) => {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: request.text,
        variables,
      }),
    };
  },
  responseTransforms: [incrementalDeliveryTransform],
};

export const getRelayEnvironment = createIsomorphicFn()
  .client(() => createRelayEnvironment({ ...config, isServer: false }))
  .server(() => createRelayEnvironment({ ...config, isServer: true }));
