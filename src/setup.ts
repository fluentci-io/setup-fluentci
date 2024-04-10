import { homedir } from "node:os";
import { join } from "node:path";
import * as action from "@actions/core";
import { getExecOutput, exec } from "@actions/exec";
import { installDocker } from "./setup-docker.js";

export default async ({
  daggerVersion,
  wasm,
  pipeline,
  args,
}): Promise<{
  version: string;
}> => {
  // throw error on unsupported platforms (windows)
  if (process.platform === "win32") {
    throw new Error("FluentCI is not supported on Windows");
  }

  if (!wasm) {
    await installDocker();
  }

  await exec("sh", [
    "-c",
    "curl -fsSL https://deno.land/x/install/install.sh | sh",
  ]);

  action.addPath(join(homedir(), ".deno", "bin"));

  await exec("deno", ["--version"]);

  await exec("deno", [
    "install",
    "-A",
    "-r",
    "https://cli.fluentci.io",
    "-n",
    "fluentci",
  ]);
  await exec("sh", [
    "-c",
    `curl -L https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=${daggerVersion} sh`,
  ]);

  await exec("sudo", ["mv", "bin/dagger", "/usr/local/bin"]);
  const version = await verifyFluentCI("fluentci");

  if (pipeline) {
    if (wasm) {
      if (!args.length) {
        throw new Error("args is required when using wasm");
      }
      for (const _args of args) {
        await exec("fluentci", [
          "run",
          "--wasm",
          pipeline,
          ..._args.split(" "),
        ]);
      }
      return { version };
    }
    if (!args.length) {
      await exec("fluentci", ["run", pipeline]);
      return { version };
    }
    for (const _args of args) {
      await exec("fluentci", ["run", pipeline, ..._args.split(" ")]);
    }
  }

  if (!pipeline) {
    if (args.length) {
      for (const _args of args) {
        await exec("fluentci", [..._args.split(" ")]);
      }
      return { version };
    }
  }

  return {
    version,
  };
};

async function verifyFluentCI(path: string): Promise<string | undefined> {
  const { exitCode, stdout } = await getExecOutput(path, ["--version"], {
    ignoreReturnCode: true,
  });
  return exitCode === 0 ? stdout.trim() : undefined;
}
