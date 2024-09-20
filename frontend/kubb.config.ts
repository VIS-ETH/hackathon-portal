import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTanstackQuery } from "@kubb/swagger-tanstack-query";
import { pluginTs } from "@kubb/swagger-ts";

const tanstackQuery = pluginTanstackQuery({
  output: {
    path: "./hooks",
  },
  client: {
    importPath: "@/api/client",
  },
});

export default defineConfig({
  root: "src/api",
  input: {
    path: "schema.json",
  },
  output: {
    path: "gen",
    clean: true,
  },
  plugins: [pluginOas(), pluginTs(), tanstackQuery],
});
