import { postgraphile } from 'postgraphile';
import preset from './graphile.config.js';

export const pgl = postgraphile(preset);
