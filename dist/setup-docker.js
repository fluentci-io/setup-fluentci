import { exec } from "@actions/exec";
import * as core from "@actions/core";
import * as os from "os";
export async function installDocker() {
    const platform = os.platform();
    if (platform === "win32") {
        core.debug("check platform");
        await exec("echo", [
            `::error::Only Support macOS platform, this platform is ${os.platform()}`,
        ]);
        return;
    }
    if (platform === "darwin") {
        // await exec("brew", ["update"]);
        await exec("sh", ["-c", "brew install docker lima"]);
        await exec("sh", ["-c", "limactl start template://docker"]);
        await exec("sh", [
            "-c",
            'docker context create lima-docker --docker "host=unix:///Users/runner/.lima/docker/sock/docker.sock"',
        ]);
        await exec("sh", ["-c", "docker context use lima-docker"]);
        return;
    }
}
