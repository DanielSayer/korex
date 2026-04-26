import path from "node:path";

export const testsRoot = process.cwd();
export const workspaceRoot = path.resolve(testsRoot, "../..");
export const dbPackageRoot = path.join(workspaceRoot, "packages/db");
export const integrationComposeFile = path.join(
  testsRoot,
  "docker-compose.integration.yml",
);
