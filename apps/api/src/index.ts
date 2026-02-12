import { postgraphile } from "postgraphile";
import { createServer } from "node:http";
import { grafserv } from "postgraphile/grafserv/node";
import { makePgService } from "postgraphile/adaptors/pg";
import PostGraphileAmberPreset from "postgraphile/presets/amber";
import { PostGraphileRelayPreset } from "postgraphile/presets/relay";

const PORT = 4000;

const pgl = postgraphile({
  extends: [PostGraphileAmberPreset, PostGraphileRelayPreset],
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
      connectionString: process.env.CONNECTION_STRING,
      schemas: ["app_public"],
      superuserConnectionString: process.env.SUPERUSER_CONNECTION_STRING,
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
