import type {
  ConcreteRequest,
  GraphQLResponse,
  OperationDescriptor,
  RequestParameters
} from 'relay-runtime';

/**
 * Creates a mock RequestParameters object for testing
 */
export function createMockRequestParameters(
  overrides: Partial<RequestParameters & { cacheID?: string }> = {}
): RequestParameters {
  return {
    id: overrides.id ?? overrides.cacheID ?? 'test-query-id',
    name: overrides.name ?? 'TestQuery',
    operationKind: overrides.operationKind ?? 'query',
    text: null,
    metadata: overrides.metadata ?? {}
  } as RequestParameters;
}

/**
 * Creates a mock ConcreteRequest for testing
 */
export function createMockConcreteRequest(
  overrides: Partial<{
    params: Partial<RequestParameters>;
  }> = {}
): ConcreteRequest {
  return {
    kind: 'Request',
    fragment: {
      kind: 'Fragment',
      name: 'TestQuery',
      type: 'Query',
      metadata: null,
      argumentDefinitions: [],
      selections: []
    },
    operation: {
      kind: 'Operation',
      name: 'TestQuery',
      argumentDefinitions: [],
      selections: []
    },
    params: createMockRequestParameters(overrides.params)
  };
}

/**
 * Creates a mock OperationDescriptor for testing
 */
export function createMockOperationDescriptor(
  overrides: Partial<{
    id?: string;
    name?: string;
    variables?: Record<string, unknown>;
  }> = {}
): OperationDescriptor {
  const params = createMockRequestParameters({
    id: overrides.id,
    name: overrides.name
  });

  const request = createMockConcreteRequest({ params });
  const variables = overrides.variables ?? {};

  return {
    fragment: {
      kind: 'SingularReaderSelector',
      dataID: 'client:root',
      node: request.fragment,
      variables,
      isWithinUnmatchedTypeRefinement: false,
      owner: {} as OperationDescriptor['fragment']['owner']
    },
    request: {
      identifier: `${params.id}:${JSON.stringify(variables)}`,
      node: request,
      variables,
      cacheConfig: {}
    },
    root: {
      dataID: 'client:root',
      node: request.operation,
      variables
    }
  } as OperationDescriptor;
}

/**
 * Creates a mock GraphQL response for testing
 */
export function createMockGraphQLResponse<TData = Record<string, unknown>>(
  data: TData,
  options: Partial<{
    errors: Array<{ message: string; locations?: unknown[]; path?: unknown[] }>;
    extensions: Record<string, unknown>;
    label?: string;
    path?: (string | number)[];
  }> = {}
): GraphQLResponse {
  return {
    data,
    errors: options.errors,
    extensions: options.extensions,
    label: options.label,
    path: options.path
  } as GraphQLResponse;
}

/**
 * Creates a multipart HTTP response string for testing
 */
export function createMultipartResponse(parts: object[], boundary = '----abc123'): string {
  const lines: string[] = [];

  for (const part of parts) {
    lines.push(`\r\n--${boundary}`);
    lines.push('Content-Type: application/json');
    lines.push('');
    lines.push(JSON.stringify(part));
  }

  lines.push(`\r\n--${boundary}--`);

  return lines.join('\r\n');
}

/**
 * Helper to create a ReadableStream from chunks for testing
 */
export function createMockStream<T>(chunks: T[]): ReadableStream<T> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    }
  });
}

/**
 * Helper to wait for microtasks to flush
 */
export function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Collects all values from a ReadableStream into an array
 */
export async function collectStream<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader();
  const results: T[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    results.push(value);
  }

  return results;
}
