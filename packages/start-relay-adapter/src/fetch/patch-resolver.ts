/**
 * Adopted from fetch-multipart-graphql
 *
 * Renamed from PatchResolver to MultipartStreamParser.
 * Now passes through raw parsed JSON without transformation —
 * incremental delivery spec conversion is handled by middleware.
 */
import { parseMultipartHttp } from './multipart-utils.js';

export class MultipartStreamParser<T> {
  onNext: (results: T[]) => void;
  boundary: string;
  #chunkBuffer: string;
  #isPreamble: boolean;
  #textDecoder: TextDecoder;

  constructor(config: { onNext: (results: T[]) => void; boundary?: string }) {
    this.boundary = config.boundary || '-';
    this.onNext = config.onNext;
    this.#chunkBuffer = '';
    this.#isPreamble = true;
    this.#textDecoder = new TextDecoder();
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
      this.onNext(parts);
    }
  }
}

/** @deprecated Use `MultipartStreamParser` instead */
export const PatchResolver = MultipartStreamParser;
