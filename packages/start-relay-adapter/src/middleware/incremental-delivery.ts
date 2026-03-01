import { IncrementalResponseTransformer } from '../fetch/incremental-response-transformer.js';
import type { ResponseTransform } from './types.js';
import type { GraphQLResponse } from 'relay-runtime';

/**
 * Response transform that converts the 2023 incremental delivery spec format
 * (used by PostGraphile v5) to the format expected by Relay.
 *
 * This is opt-in — only add this transform if your GraphQL server uses the
 * 2023 spec with `pending`/`incremental`/`completed` fields. Standard servers
 * that use the `@defer` format Relay expects natively do not need this.
 *
 * Returns a factory (called per-fetch) because the transformer is stateful —
 * it tracks pending IDs across patches within a single multipart stream.
 */
export const incrementalDeliveryTransform: ResponseTransform = () => {
  const transformer = new IncrementalResponseTransformer();
  return (response: GraphQLResponse) =>
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    transformer.transform(response as unknown as Record<string, unknown>) as unknown as GraphQLResponse[];
};
