import { defineConfig } from "tsdown";

export default defineConfig((input) => ({
  entry: "./src/index.tsx",
  outDir: "./dist",
  watch: input.watch,
  dts: true,
  format: ["esm"],
  minify: input.minify,
}));
