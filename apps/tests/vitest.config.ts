import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: "unit",
          exclude: ["src/**/*.integration.test.ts"],
          include: ["src/**/*.test.ts"],
          setupFiles: ["./src/setup/env.ts"],
        },
      },
      {
        test: {
          name: "integration",
          globals: true,
          globalSetup: ["./src/setup/integration/global-setup.ts"],
          include: ["src/**/*.integration.test.ts"],
          pool: "forks",
          setupFiles: [
            "./src/setup/env.ts",
            "./src/setup/integration/file-setup.ts",
          ],
        },
      },
    ],
  },
});
