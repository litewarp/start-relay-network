import { postgraphile } from "postgraphile";
import { createServer } from "node:http";
import { grafserv } from "postgraphile/grafserv/node";
import { makePgService } from "postgraphile/adaptors/pg";
import PostGraphileAmberPreset from "postgraphile/presets/amber";
import { PostGraphileRelayPreset } from "postgraphile/presets/relay";
import {PgSimplifyInflectionPreset} from '@graphile/simplify-inflection'
import { StreamDeferPlugin } from "postgraphile/graphile-build";
import { PgManyToManyPreset } from "@graphile-contrib/pg-many-to-many";

const PORT = 4000;

const IS_DEV = process.env.GRAPHILE_ENV === "development";

const pgl = postgraphile({
  extends: [PostGraphileAmberPreset, PostGraphileRelayPreset,  PgSimplifyInflectionPreset, PgManyToManyPreset],
  plugins: [StreamDeferPlugin],
  grafserv: {
    port: 4000,
    graphiql: IS_DEV,
    watch: IS_DEV,
    graphiqlPath: "/graphiql",
    graphiqlOnGraphQLGET: IS_DEV,
  },
  grafast: {
    explain: IS_DEV,
  },
  gather: {
    installWatchFixtures: IS_DEV,
  },
  schema: {
    exportSchemaSDLPath: IS_DEV ? "./schema.graphql" : undefined,
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
