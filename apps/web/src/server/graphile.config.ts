import { makePgService } from 'postgraphile/adaptors/pg';
import { PostGraphileAmberPreset } from 'postgraphile/presets/amber';
import { PostGraphileRelayPreset } from 'postgraphile/presets/relay';
import { PgSimplifyInflectionPreset } from '@graphile/simplify-inflection';
import { StreamDeferPlugin } from 'postgraphile/graphile-build';
import { PgManyToManyPreset } from '@graphile-contrib/pg-many-to-many';
import { EnvironmentPlugin } from './plugins/environment-plugin.js';

declare global {
  namespace Grafast {
    interface RequestContext {
      relayEnvironment?: string;
    }
  }
}

const preset = {
  extends: [
    PostGraphileAmberPreset,
    PostGraphileRelayPreset,
    PgSimplifyInflectionPreset,
    PgManyToManyPreset,
  ],
  plugins: [StreamDeferPlugin, EnvironmentPlugin],
  grafast: {
    context(requestContext, _args) {
      return {
        relayEnvironment: requestContext.relayEnvironment,
      };
    },
  },
  pgServices: [
    makePgService({
      connectionString:
        process.env.CONNECTION_STRING ??
        process.env.DATABASE_URL ??
        'postgres://postgres:postgres@localhost:6432/starwars',
      schemas: ['app_public'],
    }),
  ],
} satisfies GraphileConfig.Preset;

export default preset;
