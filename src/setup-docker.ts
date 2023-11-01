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
    await exec("sh", ["-c", "HOMEBREW_NO_AUTO_UPDATE=1 brew install docker"]);
    await exec("colima", ["start", "--cgroups-v2"]);
    return;
  }
}
