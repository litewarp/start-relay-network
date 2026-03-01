import { ClientTransport } from './client.js';
import { ServerTransport } from './server.js';

import type { TransportStream } from './types.js';

import { createSerializationAdapter } from '@tanstack/react-router';

export const transportSerializationAdapter = createSerializationAdapter<
  ServerTransport | ClientTransport,
  TransportStream
>({
  key: 'relay-ssr-transport',
  test: (value): value is ServerTransport => value instanceof ServerTransport,
  toSerializable(data) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return (data as ServerTransport).stream satisfies TransportStream as any;
  },
  fromSerializable(data) {
    return new ClientTransport(data);
  }
});
