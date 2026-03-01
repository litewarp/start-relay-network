import type { ResponseTransform } from './types.js';
import type { GraphQLResponse } from 'relay-runtime';

/**
 * Grafast's v16-compatible incremental delivery result type.
 * The base ExecutionResult has `data`, `errors`, `extensions`.
 * Patch results additionally have `hasNext`, `path`, `label`.
 */
interface GrafastResult {
  data?: Record<string, unknown> | {} | null;
  errors?: ReadonlyArray<unknown>;
  extensions?: Record<string, unknown>;
  hasNext?: boolean;
  path?: ReadonlyArray<string | number>;
  label?: string;
}

/**
 * Transforms a v16 AsyncExecutionResult (as produced by Grafast) into a
 * Relay-compatible GraphQLResponse with `extensions.is_final`.
 *
 * v16 incremental delivery format:
 *   - ExecutionResult: { data, errors, extensions }
 *   - ExecutionPatchResult: { data, errors, extensions, path, label, hasNext }
 *
 * Relay expected wire format:
 *   - { data, errors?, extensions: { is_final }, label?, path? }
 */
export function transformToRelayResponse(result: GrafastResult) {
  // ExecutionPatchResult has `hasNext` property; ExecutionResult does not
  if ('hasNext' in result && result.hasNext !== undefined) {
    const { hasNext, path, label, extensions, data, errors } = result;
    return {
      data: data ?? null,
      ...(errors ? { errors } : {}),
      ...(path ? { path } : {}),
      ...(label ? { label } : {}),
      extensions: {
        ...extensions,
        is_final: !hasNext
      }
    };
  }

  // Non-streaming ExecutionResult — always final
  const { data, errors, extensions } = result;
  return {
    data: data ?? null,
    ...(errors ? { errors } : {}),
    extensions: {
      ...extensions,
      is_final: true
    }
  };
}

/**
 * Response transform that converts Grafast's v16-compatible incremental
 * delivery format (with `hasNext`, `path`, `label`) to Relay's expected
 * wire format (with `extensions.is_final`).
 *
 * Use this transform when your GraphQL server is PostGraphile v5 / Grafast
 * and uses the v16 spec format for @defer/@stream responses.
 *
 * This is stateless — each response is transformed independently.
 */
export const grafastRelayTransform: ResponseTransform = () => {
  return (response: GraphQLResponse) => {
    const transformed = transformToRelayResponse(
      response as unknown as GrafastResult
    );
    return [transformed as unknown as GraphQLResponse];
  };
};
