import type { Transport } from "#@/transport/types.js";
import type { AnyRouter } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import {
  type RouterSsrRelayOptions,
  setCoreRouterRelayIntegration,
} from "./core";
import { RelayProvider } from "#@/transport/relay-provider.js";

export function setupRouterRelayIntegration<TRouter extends AnyRouter>(
  opts: Omit<RouterSsrRelayOptions<TRouter>, "providerContext">,
) {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const providerContext = {} as { transport: Transport };

  setCoreRouterRelayIntegration<TRouter>({ ...opts, providerContext });

  const PreviousInnerWrap = opts.router.options.InnerWrap ?? Fragment;

  opts.router.options.InnerWrap = ({ children }) => {
    return (
      <RelayProvider
        environment={opts.environment}
        queryCache={opts.queryCache}
        context={providerContext}
      >
        <PreviousInnerWrap>{children}</PreviousInnerWrap>
      </RelayProvider>
    );
  };
}
