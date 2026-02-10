import type { OperationDescriptor } from 'relay-runtime';

export function queryKeyFromIdAndVariables(
  id: string,
  variables: Record<string, any>
): string {
  return `${id}:${JSON.stringify(variables)}`;
}

export function buildQueryKey(operation: OperationDescriptor): string {
  const key = operation.request.node.params.id ?? operation.request.node.params.cacheID;
  return queryKeyFromIdAndVariables(key, operation.request.variables);
}

export function buildUniqueKey(queryKey: string): string {
  return `${queryKey}:${Date.now()}`;
}

export function parseUniqueKey(uniqueKey: string): [string, number] {
  const [queryKey, timestamp] = uniqueKey.split(':');
  return [queryKey, parseInt(timestamp)];
}
