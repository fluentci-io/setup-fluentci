import { homedir } from "node:os";
import { join } from "node:path";
import * as action from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import { parse } from "shell-quote";

interface SetupOptions {
  version?: string;
  wasm: boolean;
  pipeline: string;
  args: string[];
  workdir: string;
}

export default async function setup({
  version,
  wasm,
  pipeline,
  args,
  workdir,
}: SetupOptions): Promise<{ version: string }> {
  if (process.platform === "win32") {
    throw new Error("FluentCI is not supported on Windows");
  }

  const installDir = join(homedir(), ".local", "bin");
  // Pass overrides to sh, as documented by the CLI's curl installer.
  // pipefail prevents a failed download from appearing to install successfully.
  await exec(
    "bash",
    [
      "-o",
      "pipefail",
      "-c",
      "curl -fsSL https://raw.githubusercontent.com/fluentci-io/fluentci/main/install.sh | sh",
    ],
    {
      env: {
        ...process.env,
        FLUENTCI_INSTALL_DIR: installDir,
        FLUENTCI_VERSION: version?.trim() || "v0.17.0",
      },
    }
  );
  action.addPath(installDir);

  const fluentci = join(installDir, "fluentci");
  const { stdout } = await getExecOutput(fluentci, ["--version"]);
  const installedVersion = stdout.trim();
  if (!installedVersion) {
    throw new Error("FluentCI did not report its installed version");
  }

  // With no pipeline or arguments this action only installs the CLI.
  if (pipeline || args.length) {
    for (const line of args.length ? args : [""]) {
      // Preserve quoted arguments without executing shell substitutions.
      const parsed = parse(line, (name) => `$${name}`);
      if (parsed.some((arg) => typeof arg !== "string")) {
        throw new Error("args must contain CLI arguments, not shell operators");
      }
      await exec(fluentci, [
        "run",
        ...(wasm ? ["--wasm"] : []),
        "--work-dir",
        workdir || ".",
        ...(pipeline ? [pipeline] : []),
        ...(parsed as string[]),
      ]);
    }
  }
  return { version: installedVersion };
}
