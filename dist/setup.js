import { homedir } from "node:os";
import { join } from "node:path";
import * as action from "@actions/core";
import { getExecOutput, exec } from "@actions/exec";
import { installDocker } from "./setup-docker.js";
export default async ({ daggerVersion, wasm, pipeline, args, }) => {
    // throw error on unsupported platforms (windows)
    if (process.platform === "win32") {
        throw new Error("FluentCI is not supported on Windows");
    }
    await installDocker();
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
            if (!args) {
                throw new Error("args is required when using wasm");
            }
            await exec("fluentci", ["run", "--wasm", pipeline, ...args.split(" ")]);
            return { version };
        }
        if (!args) {
            await exec("fluentci", ["run", pipeline]);
            return { version };
        }
        await exec("fluentci", ["run", pipeline, ...args.split(" ")]);
    }
    return {
        version,
    };
};
async function verifyFluentCI(path) {
    const { exitCode, stdout } = await getExecOutput(path, ["--version"], {
        ignoreReturnCode: true,
    });
    return exitCode === 0 ? stdout.trim() : undefined;
}
