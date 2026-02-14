/**
 * Transforms GraphQL responses from the 2023 incremental delivery spec format
 * (used by PostGraphile v5) to the older format expected by Relay.
 *
 * 2023 spec format:
 *   Initial: { data, hasNext, pending: [{ id, path, label }] }
 *   Subsequent: { incremental: [{ id, data }], completed: [{ id }], hasNext }
 *
 * Relay expected format:
 *   Initial: { data, hasNext }
 *   Subsequent: { data, path, label, hasNext }
 */
export class IncrementalResponseTransformer {
  #pendingMap = new Map<string, { path: Array<string | number>; label: string }>();

  transform(response: Record<string, unknown>): Record<string, unknown>[] {
    const hasPending = Array.isArray(response.pending);
    const hasIncremental = Array.isArray(response.incremental);
    const hasCompleted = Array.isArray(response.completed);

    // Standard response without any 2023-spec fields — pass through as-is.
    // Exception: bare completion signals like { hasNext: false } have no data
    // and would crash Relay, so filter them out.
    if (!hasPending && !hasIncremental && !hasCompleted) {
      if (response.data === undefined && response.hasNext !== undefined) {
        return [];
      }
      return [response];
    }

    const results: Record<string, unknown>[] = [];

    // Register pending entries (store id → {path, label})
    if (hasPending) {
      const pending = response.pending as Array<{
        id: string;
        path: Array<string | number>;
        label?: string;
      }>;

      for (const entry of pending) {
        this.#pendingMap.set(entry.id, {
          path: entry.path,
          label: entry.label ?? ''
        });
      }
    }

    // If this is an initial response (has `data`), forward it without `pending`
    if (response.data !== undefined && !hasIncremental) {
      const { pending: _, ...rest } = response;
      results.push(rest);
    }

    // Expand incremental payloads into individual Relay-format responses
    if (hasIncremental) {
      const incremental = response.incremental as Array<{
        id: string;
        data?: Record<string, unknown>;
        items?: unknown[];
        errors?: unknown[];
      }>;
      const hasNext = response.hasNext ?? false;

      for (const item of incremental) {
        const meta = this.#pendingMap.get(item.id);
        if (!meta) continue;

        const expanded: Record<string, unknown> = {
          path: meta.path,
          label: meta.label,
          hasNext
        };

        if (item.data !== undefined) {
          expanded.data = item.data;
        }
        if (item.items !== undefined) {
          expanded.items = item.items;
        }
        if (item.errors !== undefined) {
          expanded.errors = item.errors;
        }

        results.push(expanded);
      }
    }

    // Clean up completed entries
    if (hasCompleted) {
      for (const entry of response.completed as Array<{ id: string }>) {
        this.#pendingMap.delete(entry.id);
      }
    }

    return results;
  }
}
