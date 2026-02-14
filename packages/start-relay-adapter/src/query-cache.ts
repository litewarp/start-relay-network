import { buildQueryKey } from "./cache/query-utils.js";
import { RelayQuery } from "./cache/relay-query.js";

import type { QueryEvent, QueryProgressEvent } from "#@/transport/types.js";

import { createBackpressuredCallback } from "#@/callback.js";
import { warnRelay } from "#@/debug.js";
import { Environment, type OperationDescriptor } from "relay-runtime";

export * from "./cache/query-utils.js";

export const createQueryCache = (opts?: { isServer?: boolean }) =>
  new QueryCache(opts);

export class QueryCache {
  _isServer: boolean;

  constructor(opts?: { isServer?: boolean }) {
    this._isServer = Boolean(opts?.isServer);
  }

  // server side subscription to requests
  watchQueryQueue = createBackpressuredCallback<{
    event: Extract<QueryEvent, { type: "started" }>;
    query: RelayQuery;
  }>();

  // client side map of consumed queries
  private simulatedStreamingQueries = new Map<string, RelayQuery>();

  // all stored queries
  queries: Map<string, RelayQuery> = new Map<string, RelayQuery>();

  build(operation: OperationDescriptor): RelayQuery {
    const queryId = buildQueryKey(operation);

    let query = this.get(queryId);

    if (!query) {
      query = new RelayQuery(operation);
      this.queries.set(queryId, query);
    }
    return query;
  }

  get(queryId: string): RelayQuery | undefined {
    return this.queries.get(queryId);
  }

  onQueryStarted(event: Extract<QueryEvent, { type: "started" }>): void {
    if (this._isServer) {
      throw new Error("onQueryStarted should not be called on the server");
    }
    const query = this.build(event.operation);
    this.simulatedStreamingQueries.set(event.id, query);
  }

  onQueryProgress(event: QueryProgressEvent) {
    if (this._isServer) {
      throw new Error("onQueryProgress should not be called on the server");
    }
    const query = this.simulatedStreamingQueries.get(event.id);
    if (!query) {
      throw new Error(`RelayQuery with id ${event.id} not found`);
    }
    switch (event.type) {
      case "next":
        query.next(event.data);
        break;
      case "error":
        this.simulatedStreamingQueries.delete(event.id);
        query.error(JSON.stringify(event.error));
        break;
      case "complete":
        this.simulatedStreamingQueries.delete(event.id);
        query.complete();
        break;
    }
  }

  /**
   * Can be called when the stream closed unexpectedly while there might still be unresolved
   * simulated server-side queries going on.
   * Those queries will be cancelled and then re-run in the browser.
   */
  rerunSimulatedQueries = (environment: Environment) => {
    for (const [id, query] of this.simulatedStreamingQueries) {
      this.simulatedStreamingQueries.delete(id);
      warnRelay(
        "Streaming connection closed before server query could be fully transported, rerunning:",
        query.getOperation().request,
      );

      return environment.execute({ operation: query.getOperation() });
    }
    return null;
  };

  watchQuery(query: RelayQuery) {
    const event = {
      id: query.queryKey,
      type: "started" as const,
      operation: query.getOperation(),
    };

    this.watchQueryQueue.push({ event, query });
  }
}

export type RelayStartQueryCache = ReturnType<typeof createQueryCache>;
