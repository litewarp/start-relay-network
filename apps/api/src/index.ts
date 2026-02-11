import { postgraphile } from "postgraphile";
import { createServer } from "node:http";
import { grafserv } from "postgraphile/grafserv/node";
import { makePgService } from "postgraphile/adaptors/pg";

const PORT = 4000;

const pgl = postgraphile({
  gather: {
    installWatchFixtures: true,
  },
  grafast: {
    explain: true,
  },
  grafserv: {
    port: PORT,
    graphiql: true,
    watch: true,
  },
  pgServices: [
    makePgService({
      connectionString: process.env.DATABASE_URL ?? "",
      schemas: ["app_public"],
    }),
  ],
});

const serv = pgl.createServ(grafserv);

const server = createServer();

serv.addTo(server).catch((e) => {
  console.error(e);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`GraphiQL IDE: http://localhost:${PORT}/graphiql`);
});
