import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type RunOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

export async function run(
  command: string,
  args: string[],
  options: RunOptions = {},
) {
  try {
    const { stderr, stdout } = await execFileAsync(command, args, {
      cwd: options.cwd,
      env: options.env,
      windowsHide: true,
    });

    return {
      stderr,
      stdout,
    };
  } catch (error) {
    if (isExecError(error)) {
      throw new Error(
        [
          `Command failed: ${command} ${args.join(" ")}`,
          error.stdout,
          error.stderr,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }

    throw error;
  }
}

export function composeArgs(
  composeFile: string,
  projectName: string,
  args: string[],
) {
  return ["compose", "-f", composeFile, "-p", projectName, ...args];
}

function isExecError(
  error: unknown,
): error is Error & { stdout?: string; stderr?: string } {
  return error instanceof Error && ("stdout" in error || "stderr" in error);
}
