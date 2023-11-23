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
    await exec("brew", ["update"]);
    await exec("sh", ["-c", "brew install docker lima"]);
    await exec("sh", ["-c", "lima start template://docker"]);
    return;
  }
}
