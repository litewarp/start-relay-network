import { ClientTransport } from './client.js';
import { ServerTransport } from './server.js';

import type { Transported } from './types.js';

import { createSerializationAdapter } from '@tanstack/react-router';

export const transportSerializationAdapter = createSerializationAdapter<
  ServerTransport | ClientTransport,
  Transported
>({
  key: 'relay-ssr-transport',
  test: (value): value is ServerTransport => value instanceof ServerTransport,
  toSerializable(data) {
    // TS is a bit too strict about serializability here - some values are just `unknown`, but definitely serializable
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return (data as ServerTransport).stream satisfies Transported as any;
  },
  fromSerializable(data) {
    return new ClientTransport(data);
  }
});
