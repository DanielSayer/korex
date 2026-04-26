import { composeArgs, run } from "./docker";
import { integrationComposeFile } from "./paths";

const projectName = `korex-integration-${process.pid}`;

export default async function setupIntegrationDocker() {
  await cleanupProject(projectName);

  try {
    await run(
      "docker",
      composeArgs(integrationComposeFile, projectName, ["up", "-d"]),
    );
    await waitForPostgres(projectName);

    const { stdout } = await run(
      "docker",
      composeArgs(integrationComposeFile, projectName, [
        "port",
        "postgres",
        "5432",
      ]),
    );
    const hostPort = parseHostPort(stdout);

    process.env.KOREX_INTEGRATION_DOCKER_PROJECT = projectName;
    process.env.KOREX_INTEGRATION_POSTGRES_URL = `postgres://postgres:password@127.0.0.1:${hostPort}/postgres`;

    return async () => {
      await cleanupProject(projectName);
    };
  } catch (error) {
    await cleanupProject(projectName);
    throw error;
  }
}

async function waitForPostgres(project: string) {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < 30_000) {
    try {
      await run(
        "docker",
        composeArgs(integrationComposeFile, project, [
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
    `Timed out waiting for integration Postgres: ${String(lastError)}`,
  );
}

async function cleanupProject(project: string) {
  await run("docker", [
    "compose",
    "-f",
    integrationComposeFile,
    "-p",
    project,
    "down",
    "-v",
    "--remove-orphans",
  ]).catch(() => undefined);
}

function parseHostPort(output: string) {
  const value = output.trim();
  const port = value.split(":").at(-1);

  if (!port) {
    throw new Error(`Could not parse integration Postgres port from: ${value}`);
  }

  return port;
}
