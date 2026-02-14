import { createServer } from 'node:http';
import express from 'express';
import { grafserv } from 'grafserv/express/v4';
import { pgl } from './pgl';
import preset from './graphile.config.js';
import cors from 'cors';

const serv = pgl.createServ(grafserv);

const app = express();
app.use(
  cors({
    origin: ['http://localhost:3000'],
  }),
);

const server = createServer(app);

server.once('listening', () => {
  server.on('error', (e) => console.error(e));
});

serv.addTo(app, server).catch((e) => {
  console.error(e);
  process.exit(1);
});

const { host, port } = preset.grafserv;
server.listen(port, host);

console.log(`Server listening at http://${host}:${port}`);
