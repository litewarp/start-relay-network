import { defineConfig } from "tsdown";
import pkg from "./package.json" with { type: "json" };
import { visualizer } from "rollup-plugin-visualizer";
const peerDeps = Object.keys(pkg.peerDependencies ?? {});

export default defineConfig((input) => ({
  entry: "./src/index.tsx",
  outDir: "./dist",
  watch: input.watch,
  name: "start-relay-adapter",
  dts: true,
  format: ["esm"],
  minify: input.minify,
  external: (id) =>
    // exclude all peer dependencies from the bundle
    peerDeps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
  plugins: [
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      template: "treemap",
    }),
    visualizer({
      filename: "dist/stats.json",
      template: "raw-data",
    }),
  ],
}));
