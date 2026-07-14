import { composeArgs, run } from "../integration/docker";
import { integrationComposeFile } from "../integration/paths";

const projectName = `korex-operational-${process.pid}`;

export default async function setupOperationalDocker() {
  await cleanupProject();

  try {
    await run(
      "docker",
      composeArgs(integrationComposeFile, projectName, ["up", "-d"]),
    );
    await waitForPostgres();

    const { stdout } = await run(
      "docker",
      composeArgs(integrationComposeFile, projectName, [
        "port",
        "postgres",
        "5432",
      ]),
    );

    process.env.KOREX_OPERATIONAL_DOCKER_PROJECT = projectName;
    process.env.KOREX_OPERATIONAL_POSTGRES_URL = `postgres://postgres:password@127.0.0.1:${parseHostPort(stdout)}/postgres`;

    return cleanupProject;
  } catch (error) {
    await cleanupProject();
    throw error;
  }
}

async function waitForPostgres() {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < 30_000) {
    try {
      await run(
        "docker",
        composeArgs(integrationComposeFile, projectName, [
          "exec",
          "-T",
          "postgres",
          "pg_isready",
          "-U",
          "postgres",
        ]),
      );
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(
    `Timed out waiting for operational Postgres: ${String(lastError)}`,
  );
}

async function cleanupProject() {
  await run("docker", [
    "compose",
    "-f",
    integrationComposeFile,
    "-p",
    projectName,
    "down",
    "-v",
    "--remove-orphans",
  ]).catch(() => undefined);
}

function parseHostPort(output: string) {
  const port = output.trim().split(":").at(-1);

  if (!port) {
    throw new Error(`Could not parse operational Postgres port: ${output}`);
  }

  return port;
}
