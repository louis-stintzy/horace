import { defineConfig } from "vitest/config";

export default defineConfig({
  root: import.meta.dirname,
  test: {
    environment: "node",
    fileParallelism: false,
    setupFiles: ["./tests/integration/setup.ts"],
    include: ["./tests/integration/**/*.test.ts"],
  },
});
