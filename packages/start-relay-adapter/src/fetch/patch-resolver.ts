/**
 * Adopted from fetch-multipart-graphql
 */
import { parseMultipartHttp } from './multipart-utils.js';

export class PatchResolver<T> {
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
