import { defineConfig } from "tsdown";
import pkg from "./package.json" with { type: "json" };
import { visualizer } from "rollup-plugin-visualizer";
const peerDeps = Object.keys(pkg.peerDependencies ?? {});
const deps = Object.keys(pkg.dependencies ?? {});

export default defineConfig((input) => ({
  entry: {
    index: "./src/index.tsx",
    "transforms/incremental-delivery": "./src/transforms/incremental-delivery.ts",
    "transforms/grafast-relay": "./src/transforms/grafast-relay.ts",
  },
  outDir: "./dist",
  watch: input.watch,
  name: "start-relay-adapter",
  dts: true,
  format: ["esm"],
  minify: input.minify,
  external: (id) =>
    // exclude all peer dependencies and regular dependencies from the bundle
    [...peerDeps, ...deps].some(
      (dep) => id === dep || id.startsWith(`${dep}/`),
    ),
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
