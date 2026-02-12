import { postgraphile } from "postgraphile";
import { grafserv } from "grafserv/node";
import { createServer } from "node:http";
import { makePgService } from "postgraphile/adaptors/pg";

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
    pgJwtTypes: "app_public.jwt_token",
  },
};

const pgl = postgraphile({
  grafserv: {
    port: 4000,
    graphiql: true,
    watch: true,
  },
  grafast: {
    explain: true,
  },
  gather: {
    installWatchFixtures: true,
  },
  pgServices: [
    makePgService({
      connectionString: process.env.DATABASE_URL,
      schemas: ["app_public"],
      superuserConnectionString: process.env.DATABASE_URL,
    }),
  ],
});

const serv = pgl.createServ(grafserv);

const server = createServer();

serv.addTo(server).catch((e) => {
  console.error(e);
  process.exit(1);
});

server.listen(preset.grafserv.port, () => {
  console.log(
    `GraphQL endpoint: http://localhost:${preset.grafserv.port}/graphql`,
  );
  console.log(
    `GraphiQL IDE: http://localhost:${preset.grafserv.port}/graphiql`,
  );
});
