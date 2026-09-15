import type { DocumentNode, GraphQLSchema } from 'postgraphile/graphql';
import {
  execute,
  getGrafastMiddleware,
  hookArgs,
  isAsyncIterable,
  type GrafastExecutionArgs,
} from 'postgraphile/grafast';
import { GraphQLError, parse, validate } from 'postgraphile/graphql';

// ---------------------------------------------------------------------------
// Relay response transform (inlined from graphile-relay)
// ---------------------------------------------------------------------------

interface GrafastResult {
  data?: Record<string, unknown> | {} | null;
  errors?: ReadonlyArray<unknown>;
  extensions?: Record<string, unknown>;
  hasNext?: boolean;
  path?: ReadonlyArray<string | number>;
  label?: string;
}

interface TransformedResponse {
  data: Record<string, unknown> | {} | null | undefined;
  errors?: ReadonlyArray<unknown>;
  extensions: { is_final: boolean; [key: string]: unknown };
  label?: string;
  path?: ReadonlyArray<string | number>;
}

function transformToRelayResponse(result: GrafastResult): TransformedResponse {
  if ('hasNext' in result && result.hasNext !== undefined) {
    const { hasNext, path, label, extensions, data, errors } = result;
    return {
      data: data ?? null,
      ...(errors ? { errors } : {}),
      ...(path ? { path } : {}),
      ...(label ? { label } : {}),
      extensions: {
        ...extensions,
        is_final: !hasNext,
      },
    };
  }

  const { data, errors, extensions } = result;
  return {
    data: data ?? null,
    ...(errors ? { errors } : {}),
    extensions: {
      ...extensions,
      is_final: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidUnpersistedRequest(obj: unknown): obj is {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
} {
  if (!isRecord(obj)) return false;
  if (typeof obj.query !== 'string') return false;
  if (obj.variables !== undefined && !isRecord(obj.variables)) return false;
  if (obj.operationName !== undefined && typeof obj.operationName !== 'string') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Error masking
// ---------------------------------------------------------------------------

function maskError(error: GraphQLError): GraphQLError {
  if (!error.originalError) return error;
  const extensions: Record<string, unknown> = {};
  if (typeof error.extensions?.code === 'string') {
    extensions.code = error.extensions.code;
  }
  return new GraphQLError('An unexpected error occurred.', {
    nodes: error.nodes,
    path: error.path ?? undefined,
    positions: error.positions ?? undefined,
    extensions: Object.keys(extensions).length > 0 ? extensions : undefined,
  });
}

interface MaskableResult {
  data?: Record<string, unknown> | {} | null;
  errors?: ReadonlyArray<unknown>;
  extensions?: Record<string, unknown>;
  hasNext?: boolean;
  path?: ReadonlyArray<string | number>;
  label?: string;
}

function maskResultErrors<T extends MaskableResult>(result: T): T {
  if (!result.errors?.length) return result;
  return {
    ...result,
    errors: result.errors.map((e) => (e instanceof GraphQLError ? maskError(e) : e)),
  };
}

// ---------------------------------------------------------------------------
// Parse & validate cache
// ---------------------------------------------------------------------------

type ParseAndValidateResult =
  | { document: DocumentNode; errors?: undefined }
  | { document?: undefined; errors: readonly GraphQLError[] };

function makeParseAndValidateCache(schema: GraphQLSchema, maxLength = 500) {
  const cache = maxLength >= 1 ? new Map<string, ParseAndValidateResult>() : null;

  let lastQuery: string | undefined;
  let lastResult: ParseAndValidateResult | undefined;

  return function parseAndValidate(query: string): ParseAndValidateResult {
    if (lastQuery === query && lastResult) return lastResult;

    const cached = cache?.get(query);
    if (cached) {
      lastQuery = query;
      lastResult = cached;
      return cached;
    }

    let document: DocumentNode;
    try {
      document = parse(query);
    } catch (e) {
      const result: ParseAndValidateResult = { errors: [e as GraphQLError] };
      if (cache) {
        if (cache.size >= maxLength) {
          const first = cache.keys().next().value;
          if (first !== undefined) cache.delete(first);
        }
        cache.set(query, result);
      }
      lastQuery = query;
      lastResult = result;
      return result;
    }

    const errors = validate(schema, document);
    const result: ParseAndValidateResult = errors.length ? { errors } : { document };
    if (cache) {
      if (cache.size >= maxLength) {
        const first = cache.keys().next().value;
        if (first !== undefined) cache.delete(first);
      }
      cache.set(query, result);
    }
    lastQuery = query;
    lastResult = result;
    return result;
  };
}

// ---------------------------------------------------------------------------
// Content negotiation
// ---------------------------------------------------------------------------

const APPLICATION_JSON = 'application/json';
const APPLICATION_GRAPHQL_RESPONSE_JSON = 'application/graphql-response+json';

function negotiateContentType(accept: string | null): string | null {
  if (!accept) return APPLICATION_JSON;
  if (accept === '*/*') return APPLICATION_GRAPHQL_RESPONSE_JSON;
  if (accept.includes(APPLICATION_GRAPHQL_RESPONSE_JSON)) return APPLICATION_GRAPHQL_RESPONSE_JSON;
  if (accept.includes(APPLICATION_JSON)) return APPLICATION_JSON;
  if (accept.includes('*/*')) return APPLICATION_GRAPHQL_RESPONSE_JSON;
  return null;
}

// ---------------------------------------------------------------------------
// Multipart streaming helpers
// ---------------------------------------------------------------------------

function writePartialResult(
  result: TransformedResponse,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  controller.enqueue(encoder.encode('\r\n'));
  controller.enqueue(encoder.encode('Content-Type: application/json; charset=utf-8'));
  controller.enqueue(encoder.encode('\r\n'));

  const chunk = JSON.stringify(result);
  const encodedChunk = encoder.encode(chunk);

  controller.enqueue(encoder.encode(`Content-Length: ${encodedChunk.byteLength}`));
  controller.enqueue(encoder.encode('\r\n'));
  controller.enqueue(encoder.encode('\r\n'));
  controller.enqueue(encodedChunk);
  controller.enqueue(encoder.encode('\r\n'));

  controller.enqueue(encoder.encode('---'));
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface HandlerOptions {
  schema: GraphQLSchema;
  resolvedPreset: GraphileConfig.ResolvedPreset;
}

export function createHandler(
  opts: HandlerOptions,
): (request: Request, requestContext?: Grafast.RequestContext) => Promise<Response> {
  const { schema, resolvedPreset } = opts;
  const grafastMiddleware = getGrafastMiddleware(resolvedPreset);
  const parseAndValidate = makeParseAndValidateCache(schema);

  return async function httpHandler(
    request: Request,
    requestContext?: Grafast.RequestContext,
  ): Promise<Response> {
    // --- content negotiation ---
    const accept = request.headers.get('accept');
    const contentType = negotiateContentType(accept);
    if (!contentType) {
      return Response.json(
        {
          errors: [
            {
              message:
                'Not Acceptable. Supported types: application/json, application/graphql-response+json',
            },
          ],
        },
        { status: 406 },
      );
    }
    const isLegacy = contentType === APPLICATION_JSON;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { errors: [{ message: 'Invalid JSON body' }] },
        { status: 400, headers: { 'content-type': contentType } },
      );
    }

    // --- resolve document ---
    let document: DocumentNode;
    let variableValues: Record<string, unknown> | undefined;
    let operationName: string | undefined;

    if (isValidUnpersistedRequest(body)) {
      const result = parseAndValidate(body.query);
      if (result.errors) {
        return Response.json(
          { errors: result.errors },
          {
            status: isLegacy ? 200 : 400,
            headers: { 'content-type': contentType },
          },
        );
      }
      document = result.document;
      variableValues = body.variables;
      operationName = body.operationName;
    } else {
      return Response.json(
        { errors: [{ message: 'Invalid request body' }] },
        { status: 400, headers: { 'content-type': contentType } },
      );
    }

    // --- build execution args with hookArgs ---
    const args: GrafastExecutionArgs = {
      schema,
      document,
      rootValue: null,
      contextValue: Object.create(null),
      variableValues,
      operationName,
      resolvedPreset,
      requestContext: requestContext ?? {},
      middleware: grafastMiddleware,
    };

    try {
      await hookArgs(args);
      const result = await execute(args);

      if (!isAsyncIterable(result)) {
        const masked = maskResultErrors(result);
        return Response.json(transformToRelayResponse(masked), {
          headers: { 'content-type': contentType },
        });
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          let count = 0;
          for await (const payload of result) {
            if (count === 0) {
              controller.enqueue(encoder.encode('\r\n'));
              controller.enqueue(encoder.encode('---'));
            }
            count++;
            const masked = maskResultErrors(payload as MaskableResult);
            const transformed = transformToRelayResponse(masked);
            writePartialResult(transformed, encoder, controller);
            if (!(payload as MaskableResult).hasNext) {
              controller.enqueue(encoder.encode('--\r\n'));
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'multipart/mixed; boundary="-"' },
      });
    } catch (error) {
      console.error('Error processing GraphQL request:', error);
      return Response.json(
        { errors: [{ message: 'Internal Server Error' }] },
        { status: 500, headers: { 'content-type': contentType } },
      );
    }
  };
}
