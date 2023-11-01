import { homedir } from "node:os";
import { join } from "node:path";
import * as action from "@actions/core";
import { getExecOutput, exec } from "@actions/exec";
export default async () => {
    // throw error on unsupported platforms (windows)
    if (process.platform === "win32") {
        throw new Error("FluentCI is not supported on Windows");
    }
    await exec("sh", [
        "-c",
        "curl -fsSL https://deno.land/x/install/install.sh | sh",
    ]);
    action.addPath(join(homedir(), ".deno", "bin"));
    await exec("deno", [
        "install",
        "-A",
        "-r",
        "https://cli.fluentci.io -n fluentci",
    ]);
    await exec("sh", [
        "-c",
        "curl -L https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.8.8 sh",
    ]);
    await exec("sudo", ["mv", "bin/dagger", "/usr/local/bin"]);
    const version = await verifyFluentCI("fluentci");
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
