import type { GraphQLResponse } from 'relay-runtime';

/**
 * Adopted from fetch-multipart-graphql
 */
import { debugFetch } from '#@/debug.js';
import { getBoundary } from '#@/fetch/multipart-utils.js';
import { PatchResolver } from '#@/fetch/patch-resolver.js';
import { observableFromStream } from '#@/stream.js';
import { coerceError } from '#@/utils.js';

export interface MultipartFetchOptions {
  url: string;
  getRequestInit: () => Promise<RequestInit>;
  onNext: (patch: GraphQLResponse[]) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export async function multipartFetch(opts: MultipartFetchOptions): Promise<void> {
  const fetchOptions = await opts.getRequestInit();
  debugFetch('Fetch options:', fetchOptions);
  const res = await fetch(opts.url, fetchOptions);
  const contentType = res.headers.get('Content-Type') ?? '';

  // @defer uses multipart responses to stream patches over HTTP
  if (res.status < 300 && contentType.includes('multipart/mixed')) {
    if (!res.body) throw new Error('Malformed Response');

    const patch = new PatchResolver<GraphQLResponse>({
      onNext: opts.onNext,
      boundary: getBoundary(contentType)
    });

    observableFromStream(res.body).subscribe({
      next: (val) => patch.handleChunk(val),
      complete: () => opts.onComplete(),
      error: (err: unknown) => opts.onError(coerceError(err))
    });
  }
  // otherwise just return as normal
  return res.json().then((json) => {
    opts.onNext([json]);
    opts.onComplete();
  });
}
