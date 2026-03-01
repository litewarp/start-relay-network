import type { Transport } from "#@/transport/types.js";
import type { AnyRouter } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import {
  type RouterRelayOptions,
  configureRouterRelay,
} from "./core";
import { RelayProvider } from "#@/transport/relay-provider.js";

export function integrateRelayWithRouter<TRouter extends AnyRouter>(
  opts: Omit<RouterRelayOptions<TRouter>, "providerContext">,
) {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const providerContext = {} as { transport: Transport };

  configureRouterRelay<TRouter>({ ...opts, providerContext });

  const PreviousInnerWrap = opts.router.options.InnerWrap ?? Fragment;

  opts.router.options.InnerWrap = ({ children }) => {
    return (
      <RelayProvider
        environment={opts.environment}
        context={providerContext}
      >
        <PreviousInnerWrap>{children}</PreviousInnerWrap>
      </RelayProvider>
    );
  };
}

/** @deprecated Use `integrateRelayWithRouter` instead */
export const setupRouterRelayIntegration = integrateRelayWithRouter;
