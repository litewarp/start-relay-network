import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    { enforce: "pre" as const, ...mdx() },
    tanstackStart({
      srcDirectory: "src",
    }),
    viteReact({
      babel: {
        plugins: ["relay"],
      },
    }),
  ],
});
