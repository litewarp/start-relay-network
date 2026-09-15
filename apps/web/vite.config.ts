import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { relay } from './vite-plugin-relay';
import mdx from '@mdx-js/rollup';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    { enforce: 'pre' as const, ...mdx() },
    tanstackStart({
      srcDirectory: 'src',
      server: { entry: './server/entry.ts' },
    }),
    viteReact(),
    // plugin-react 6 transforms JSX with oxc and no longer runs babel plugins,
    // so the Relay transform gets its own plugin (client and SSR).
    relay(),
  ],
});
