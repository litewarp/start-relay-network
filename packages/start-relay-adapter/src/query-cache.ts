import { buildQueryKey } from "./cache/query-utils.js";
import { QueryRecord } from "./cache/relay-query.js";

import type { QueryEvent, QueryProgressEvent } from "#@/transport/types.js";

import { warnRelay } from "#@/debug.js";
import runtime, { Environment, type OperationDescriptor } from "relay-runtime";

export * from "./cache/query-utils.js";

export const createQueryRegistry = (opts?: { isServer?: boolean }) =>
  new QueryRegistry(opts);

/** @deprecated Use `createQueryRegistry` instead */
export const createQueryCache = createQueryRegistry;

export class QueryRegistry {
  _isServer: boolean;

  constructor(opts?: { isServer?: boolean }) {
    this._isServer = Boolean(opts?.isServer);
  }

  // server side subscription to query events via ReplaySubject
  private _querySubject = new runtime.ReplaySubject<{
    event: Extract<QueryEvent, { type: "started" }>;
    query: QueryRecord;
  }>();

  subscribeToQueries(
    observer: runtime.Observer<{
      event: Extract<QueryEvent, { type: "started" }>;
      query: QueryRecord;
    }>
  ): runtime.Subscription {
    return this._querySubject.subscribe(observer);
  }

  // client side map of consumed queries
  private simulatedStreamingQueries = new Map<string, QueryRecord>();

  // all stored queries
  queries: Map<string, QueryRecord> = new Map<string, QueryRecord>();

  build(operation: OperationDescriptor): QueryRecord {
    const queryId = buildQueryKey(operation);

    let query = this.get(queryId);

    if (!query) {
      query = new QueryRecord(operation);
      this.queries.set(queryId, query);
    }
    return query;
  }

  get(queryId: string): QueryRecord | undefined {
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
      throw new Error(`QueryRecord with id ${event.id} not found`);
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
   * Called when the stream closes unexpectedly while there might still be
   * unresolved simulated server-side queries. Those queries will be cancelled
   * and then re-run in the browser.
   */
  onStreamClosed = (environment: Environment) => {
    for (const [id, query] of this.simulatedStreamingQueries) {
      this.simulatedStreamingQueries.delete(id);
      warnRelay(
        "Streaming connection closed before server query could be fully transported, rerunning:",
        query.operation.request,
      );

      return environment.execute({ operation: query.operation });
    }
    return null;
  };

  watchQuery(query: QueryRecord) {
    const event = {
      id: query.queryKey,
      type: "started" as const,
      operation: query.operation,
    };

    this._querySubject.next({ event, query });
  }
}

/** @deprecated Use `QueryRegistry` instead */
export const QueryCache = QueryRegistry;
/** @deprecated Use `QueryRegistry` instead */
export type QueryCache = QueryRegistry;

export type RelayStartQueryRegistry = QueryRegistry;
/** @deprecated Use `RelayStartQueryRegistry` instead */
export type RelayStartQueryCache = QueryRegistry;
