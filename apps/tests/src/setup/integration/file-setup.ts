import { beforeEach } from "vitest";
import { composeArgs, run } from "./docker";
import { dbPackageRoot, integrationComposeFile } from "./paths";
import { seedIntegrationDb } from "./seed";

const projectName = requiredEnv("KOREX_INTEGRATION_DOCKER_PROJECT");
const adminDatabaseUrl = requiredEnv("KOREX_INTEGRATION_POSTGRES_URL");
const databaseName = createDatabaseName();
const databaseUrl = adminDatabaseUrl.replace(/\/postgres$/, `/${databaseName}`);

process.env.DATABASE_URL = databaseUrl;

await createDatabase(databaseName);
await pushSchema(databaseUrl);

beforeEach(async () => {
  await truncateDatabase(databaseName);
  await seedIntegrationDb({
    databaseName,
    databaseUrl,
  });
});

async function createDatabase(name: string) {
  await run(
    "docker",
    composeArgs(integrationComposeFile, projectName, [
      "exec",
      "-T",
      "postgres",
      "createdb",
      "-U",
      "postgres",
      name,
    ]),
  );
}

async function pushSchema(url: string) {
  await run("pnpm", ["run", "db:push"], {
    cwd: dbPackageRoot,
    env: {
      ...process.env,
      DATABASE_URL: url,
    },
  });
}

async function truncateDatabase(name: string) {
  await runSql(
    name,
    `
DO $$
DECLARE
  statements text;
BEGIN
  SELECT string_agg(format('TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE', schemaname, tablename), '; ')
  INTO statements
  FROM pg_tables
  WHERE schemaname = 'public';

  IF statements IS NOT NULL THEN
    EXECUTE statements;
  END IF;
END $$;
`,
  );
}

async function runSql(database: string, sql: string) {
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
      database,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql,
    ]),
  );
}

function createDatabaseName() {
  return `korex_it_${process.pid}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for integration tests`);
  }

  return value;
}
