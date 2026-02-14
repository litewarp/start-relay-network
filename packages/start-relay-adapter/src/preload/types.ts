import type {
  OperationDescriptor,
  PreloadedQuery as RelayPreloadedQuery,
} from "react-relay";
import type { OperationType } from "relay-runtime";
import type { SerializableExtensions } from "@tanstack/react-router";

// Mark PreloadedQuery as TsrSerializable so TanStack Start's type-level
// serialization check passes without recursing into Relay's non-serializable
// fields (environment methods, Observable, etc.). Actual serialization is
// handled at runtime by the adapter's createPreloadedQuerySerializer.
export type PreloadedQuery<TQuery extends OperationType> =
  RelayPreloadedQuery<TQuery> &
    SerializableExtensions["TsrSerializable"] & {
      $__relay_queryRef?: {
        operation: OperationDescriptor;
      };
    };
