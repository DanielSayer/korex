import { beforeEach } from "vitest";
import { composeArgs, run } from "../integration/docker";
import { dbPackageRoot, integrationComposeFile } from "../integration/paths";

const projectName = requiredEnv("KOREX_OPERATIONAL_DOCKER_PROJECT");
const adminDatabaseUrl = requiredEnv("KOREX_OPERATIONAL_POSTGRES_URL");
const databaseName = createDatabaseName();

process.env.DATABASE_URL = adminDatabaseUrl.replace(
  /\/postgres$/,
  `/${databaseName}`,
);

await createDatabase();
await pushSchema();

beforeEach(async () => {
  await truncateDatabase();
});

async function createDatabase() {
  await run(
    "docker",
    composeArgs(integrationComposeFile, projectName, [
      "exec",
      "-T",
      "postgres",
      "createdb",
      "-U",
      "postgres",
      databaseName,
    ]),
  );
}

async function pushSchema() {
  await run("pnpm", ["run", "db:push"], {
    cwd: dbPackageRoot,
    env: process.env,
  });
}

async function truncateDatabase() {
  await run(
    "docker",
    composeArgs(integrationComposeFile, projectName, [
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "postgres",
      "-d",
      databaseName,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      `
DO $$
DECLARE
  statements text;
BEGIN
  SELECT string_agg(format('TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE', schemaname, tablename), '; ')
  INTO statements
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema');

  IF statements IS NOT NULL THEN
    EXECUTE statements;
  END IF;
END $$;
`,
    ]),
  );
}

function createDatabaseName() {
  return `korex_op_${process.pid}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for operational tests`);
  }

  return value;
}
