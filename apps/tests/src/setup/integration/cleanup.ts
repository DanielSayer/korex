import { composeArgs, run } from "./docker";
import { integrationComposeFile } from "./paths";

const { stdout } = await run("docker", [
  "ps",
  "-a",
  "--filter",
  "label=com.korex.integration-tests=true",
  "--format",
  '{{.Label "com.docker.compose.project"}}',
]).catch(() => ({ stdout: "" }));

const projects = new Set(
  stdout
    .split(/\r?\n/)
    .map((project) => project.trim())
    .filter((project) => project.startsWith("korex-integration-")),
);

for (const project of projects) {
  await run(
    "docker",
    composeArgs(integrationComposeFile, project, [
      "down",
      "-v",
      "--remove-orphans",
    ]),
  ).catch(() => undefined);
}
