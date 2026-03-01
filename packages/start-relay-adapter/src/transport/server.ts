import type { QueryRecord } from '#@/cache/relay-query.js';
import type {
  TransportStream,
  QueryEvent,
} from './types.js';

export class ServerTransport {
  stream: TransportStream;
  private controller!: ReadableStreamDefaultController<QueryEvent>;
  private pendingQueries = new Set<Extract<QueryEvent, { type: 'started' }>>();

  private closed = false;
  private shouldClose = false;

  constructor() {
    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      }
    });
  }

  drainAndClose() {
    this.shouldClose = true;
    this.closeIfFinished();
  }

  private closeIfFinished() {
    if (this.shouldClose && this.pendingQueries.size === 0 && !this.closed) {
      this.controller.close();
      this.closed = true;
    }
  }

  trackQuery = ({
    event,
    query
  }: {
    event: Extract<QueryEvent, { type: 'started' }>;
    query: QueryRecord;
  }): void => {
    this.controller.enqueue(event);
    this.pendingQueries.add(event);
    const finalize = () => {
      this.pendingQueries.delete(event);
      this.closeIfFinished();
    };
    query.subscribe({
      next: (ev) => {
        if (!this.closed) {
          this.controller.enqueue(ev);
        }
      },
      error: finalize,
      complete: finalize
    });
  };
}
