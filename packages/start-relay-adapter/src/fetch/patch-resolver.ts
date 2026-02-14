/**
 * Adopted from fetch-multipart-graphql
 */
import { IncrementalResponseTransformer } from './incremental-response-transformer.js';
import { parseMultipartHttp } from './multipart-utils.js';

export class PatchResolver<T> {
  onNext: (results: T[]) => void;
  boundary: string;
  #chunkBuffer: string;
  #isPreamble: boolean;
  #textDecoder: TextDecoder;
  #transformer: IncrementalResponseTransformer;

  constructor(config: { onNext: (results: T[]) => void; boundary?: string }) {
    this.boundary = config.boundary || '-';
    this.onNext = config.onNext;
    this.#chunkBuffer = '';
    this.#isPreamble = true;
    this.#textDecoder = new TextDecoder();
    this.#transformer = new IncrementalResponseTransformer();
  }

  handleChunk(chunk: Uint8Array<ArrayBuffer>) {
    const data = this.#textDecoder.decode(chunk);
    const prevParts: T[] = [];
    this.#chunkBuffer += data;
    const { newBuffer, parts, isPreamble } = parseMultipartHttp(
      this.#chunkBuffer,
      this.boundary,
      prevParts,
      this.#isPreamble
    );
    this.#isPreamble = isPreamble;
    this.#chunkBuffer = newBuffer;
    if (parts.length) {
      const transformed = parts.flatMap((part) =>
        this.#transformer.transform(part as Record<string, unknown>)
      ) as T[];
      if (transformed.length) {
        this.onNext(transformed);
      }
    }
  }
}
