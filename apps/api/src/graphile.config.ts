import { makePgService } from 'postgraphile/adaptors/pg';
import PostGraphileAmberPreset from 'postgraphile/presets/amber';
import { PostGraphileRelayPreset } from 'postgraphile/presets/relay';
import { PgSimplifyInflectionPreset } from '@graphile/simplify-inflection';
import { StreamDeferPlugin } from 'postgraphile/graphile-build';
import { PgManyToManyPreset } from '@graphile-contrib/pg-many-to-many';
import { EnvironmentPlugin } from './plugins/environment-plugin.js';

const IS_DEV = process.env.GRAPHILE_ENV === 'development';
const HOST = process.env.HOST ?? 'localhost';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

const preset = {
  extends: [
    PostGraphileAmberPreset,
    PostGraphileRelayPreset,
    PgSimplifyInflectionPreset,
    PgManyToManyPreset,
  ],
  plugins: [StreamDeferPlugin, EnvironmentPlugin],
  grafserv: {
    host: HOST,
    port: PORT,
    graphiql: IS_DEV,
    watch: IS_DEV,
    graphiqlPath: '/graphiql',
    graphiqlOnGraphQLGET: IS_DEV,
  },
  grafast: {
    explain: IS_DEV,
    context(requestContext, _args) {
      const req = requestContext.expressv4?.req ?? requestContext.node?.req;
      const header = req?.headers?.['x-relay-environment'];
      return {
        relayEnvironment: typeof header === 'string' ? header : undefined,
      };
    },
  },
  gather: {
    installWatchFixtures: IS_DEV,
  },
  schema: {
    exportSchemaSDLPath: IS_DEV ? './schema.graphql' : undefined,
  },
  pgServices: [
    makePgService({
      connectionString: process.env.CONNECTION_STRING,
      schemas: ['app_public'],
      superuserConnectionString: process.env.SUPERUSER_CONNECTION_STRING,
    }),
  ],
} satisfies GraphileConfig.Preset;

export default preset;
