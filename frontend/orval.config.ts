import { defineConfig } from "orval";

export default defineConfig({
  portal: {
    input: {
      target: "src/api/schema.json",
    },
    output: {
      mode: "split",
      target: "src/api/gen/index.ts",
      schemas: "src/api/gen/schemas",
      client: "react-query",
      override: {
        mutator: {
          path: "src/api/client.ts",
          name: "customInstance",
        },
      },
    },
  },
});
