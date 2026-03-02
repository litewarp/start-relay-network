import type {
  OperationDescriptor,
  PreloadedQuery as RelayPreloadedQuery,
} from "react-relay";
import type { OperationType } from "relay-runtime";

export type PreloadedQuery<TQuery extends OperationType> =
  RelayPreloadedQuery<TQuery> & {
    $__relay_queryRef?: {
      operation: OperationDescriptor;
    };
  };

declare module "@tanstack/react-router" {
  interface SerializableExtensions {
    RelayPreloadedQuery: PreloadedQuery<OperationType>;
  }
}
