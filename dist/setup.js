import { homedir } from "node:os";
import { join } from "node:path";
import * as action from "@actions/core";
import { getExecOutput, exec } from "@actions/exec";
import { installDocker } from "./setup-docker.js";
export default async ({ daggerVersion, engineVersion, wasm, pipeline, args, workdir, }) => {
    // throw error on unsupported platforms (windows)
    if (process.platform === "win32") {
        throw new Error("FluentCI is not supported on Windows");
    }
    if (!wasm) {
        await installDocker();
    }
    // add nix, mise, vfox and rye to PATH
    action.addPath(join(homedir(), ".rye", "shims"));
    action.addPath(join(homedir(), ".local", "share", "mise", "shims"));
    action.addPath(join(homedir(), ".version-fox", "shims"));
    action.addPath(join(homedir(), ".nix-profile", "bin"));
    action.addPath("/nix/var/nix/profiles/default/bin");
    await exec("sh", [
        "-c",
        "curl -fsSL https://deno.land/x/install/install.sh | sh",
    ]);
    action.addPath(join(homedir(), ".deno", "bin"));
    await exec("deno", ["--version"]);
    await exec("deno", [
        "install",
        "-A",
        "-g",
        "-f",
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
    if (engineVersion) {
        action.exportVariable("FLUENTCI_ENGINE_VERSION", engineVersion.startsWith("v") ? engineVersion : `v${engineVersion}`);
    }
    if (pipeline) {
        if (wasm) {
            if (!args.length) {
                throw new Error("args is required when using wasm");
            }
            for (const _args of args) {
                await exec("fluentci", ["run", "--wasm", pipeline, ..._args.split(" ")], {
                    cwd: workdir,
                });
            }
            return { version };
        }
        if (!args.length) {
            await exec("fluentci", ["run", pipeline], { cwd: workdir });
            return { version };
        }
        for (const _args of args) {
            await exec("fluentci", ["run", pipeline, ..._args.split(" ")], {
                cwd: workdir,
            });
        }
    }
    if (!pipeline) {
        if (args.length) {
            for (const _args of args) {
                if (wasm) {
                    await exec("fluentci", ["run", "--wasm", ..._args.split(" ")], {
                        cwd: workdir,
                    });
                }
                else {
                    await exec("fluentci", ["run", ..._args.split(" ")], {
                        cwd: workdir,
                    });
                }
            }
            return { version };
        }
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
