import { transformAsync } from '@babel/core';
import type { Plugin } from 'vite';

/**
 * Runs babel-plugin-relay over source files that contain a `graphql` tagged
 * template, in every Vite environment (client and SSR). Reads relay.config.json
 * from the app root, like the compiler does.
 */
export function relay(): Plugin {
  return {
    name: 'relay-babel',
    enforce: 'pre',
    async transform(code, id) {
      const [filename] = id.split('?');
      if (!/\.[jt]sx?$/.test(filename)) return null;
      if (filename.includes('/node_modules/')) return null;
      if (!code.includes('graphql`')) return null;

      const result = await transformAsync(code, {
        filename,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        parserOpts: { plugins: ['jsx', 'typescript'] },
        plugins: ['babel-plugin-relay'],
      });
      if (!result?.code) return null;
      return { code: result.code, map: result.map ?? undefined };
    },
  };
}
