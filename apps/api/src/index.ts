import { postgraphile, makePluginHook } from 'postgraphile';
import { grafserv } from 'grafserv/node';
import { createServer } from 'node:http';

const pluginHook = makePluginHook([]);

const preset = {
  grafserv: {
    port: 4000,
    graphiql: true,
    watch: true,
  },
  grafast: {
    explain: true,
  },
  gather: {
    pgJwtSecret: process.env.JWT_SECRET,
  },
  schema: {
    pgJwtTypes: 'app_public.jwt_token',
  },
};

const pgl = postgraphile({
  ...preset,
  connection: {
    connectionString:
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/app',
  },
  schemas: ['app_public'],
});

const serv = pgl.createServ(grafserv);

const server = createServer();

serv.addTo(server).catch((e) => {
  console.error(e);
  process.exit(1);
});

server.listen(preset.grafserv.port, () => {
  console.log(`GraphQL endpoint: http://localhost:${preset.grafserv.port}/graphql`);
  console.log(`GraphiQL IDE: http://localhost:${preset.grafserv.port}/graphiql`);
});
