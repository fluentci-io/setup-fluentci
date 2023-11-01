import { exec } from "@actions/exec";
import * as core from "@actions/core";
import * as os from "os";
const DOCKER_CLI_EXPERIMENTAL = core.getInput("docker_cli_experimental");
const DOCKER_DAEMON_JSON = core.getInput("docker_daemon_json");
const DOCKER_BUILDX = core.getInput("docker_buildx");
import { exec as systemExec } from "child_process";
async function shell(cmd) {
    return await new Promise((resolve, reject) => {
        systemExec(cmd, function (error, stdout, stderr) {
            if (error) {
                reject(error);
            }
            if (stderr) {
                reject(stderr);
            }
            resolve(stdout.trim());
        });
    });
}
async function buildx() {
    core.debug("set DOCKER_CLI_EXPERIMENTAL");
    if (DOCKER_CLI_EXPERIMENTAL === "enabled") {
        core.exportVariable("DOCKER_CLI_EXPERIMENTAL", "enabled");
    }
    if (DOCKER_BUILDX !== "true") {
        core.info("buildx disabled");
        return;
    }
    core.exportVariable("DOCKER_CLI_EXPERIMENTAL", "enabled");
    await exec("docker", ["buildx", "version"]).then(async () => {
        // install buildx
        core.startGroup("setup qemu");
        await exec("docker", [
            "run",
            "--rm",
            "--privileged",
            "ghcr.io/dpsigs/tonistiigi-binfmt:latest",
            "--install",
            "all",
        ]);
        core.endGroup();
        core.startGroup("list /proc/sys/fs/binfmt_misc");
        await exec("ls -la", ["/proc/sys/fs/binfmt_misc"]).catch(() => { });
        core.endGroup();
        core.startGroup("create buildx instance");
        await exec("docker", [
            "buildx",
            "create",
            "--use",
            "--name",
            "mybuilder",
            "--driver",
            "docker-container",
            "--driver-opt",
            // 'image=moby/buildkit:master'
            // moby/buildkit:buildx-stable-1
            "image=ghcr.io/dpsigs/moby-buildkit:master",
            // $ docker pull moby/buildkit:master
            // $ docker tag moby/buildkit:master ghcr.io/dpsigs/moby-buildkit:master
            // $ docker push ghcr.io/dpsigs/moby-buildkit:master
        ]);
        core.endGroup();
        core.startGroup("inspect buildx instance");
        await exec("docker", ["buildx", "inspect", "--bootstrap"]);
        core.endGroup();
    }, () => {
        core.info("this docker version NOT Support Buildx");
    });
}
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
        // macos
        if (os.arch() !== "x64") {
            core.warning("only support macOS x86_64, os arch is " + os.arch());
            return;
        }
        core.exportVariable("DOCKER_CONFIG", "/Users/runner/.docker");
        await exec("docker", ["--version"]).catch(() => { });
        await exec("docker-compose", ["--version"]).catch(() => { });
        core.startGroup("install docker");
        // await exec('brew', ['update'])
        await exec("wget", [
            "https://raw.githubusercontent.com/Homebrew/homebrew-cask/fe866ec0765de141599745f03e215452db7f511b/Casks/docker.rb",
        ]);
        // await exec('wget', ['https://raw.githubusercontent.com/Homebrew/homebrew-cask/master/Casks/docker.rb']);
        await exec("brew", [
            "install",
            "--cask",
            // DOCKER_CHANNEL !== 'stable' ? 'docker' : 'docker',
            "docker.rb",
        ]);
        core.endGroup();
        await exec("mkdir", ["-p", "/Users/runner/.docker"]);
        await shell(`echo '${DOCKER_DAEMON_JSON}' | sudo tee /Users/runner/.docker/daemon.json`);
        core.startGroup("show daemon json content");
        await exec("cat", ["/Users/runner/.docker/daemon.json"]);
        core.endGroup();
        core.startGroup("start docker step1");
        // https://github.com/docker/for-mac/issues/2359#issuecomment-943131345
        await exec("sudo", [
            "/Applications/Docker.app/Contents/MacOS/Docker",
            "--unattended",
            "--install-privileged-components",
        ]);
        core.endGroup();
        core.startGroup("start docker step2");
        await exec("open", [
            "-a",
            "/Applications/Docker.app",
            "--args",
            "--unattended",
            "--accept-license",
        ]);
        core.endGroup();
        core.startGroup("wait docker running");
        await exec("sudo", [
            "bash",
            "-c",
            `
set -x
command -v docker || echo 'test docker command 1: not found'
i=0
while ! /Applications/Docker.app/Contents/Resources/bin/docker system info &>/dev/null; do
(( i++ == 0 )) && printf %s '-- Waiting for Docker to finish starting up...' || printf '.'
command -v docker || echo 'test docker command loop: not found'
sleep 1
# wait 180s(3min)
if [ $i -gt 180 ];then exit 1;sudo /Applications/Docker.app/Contents/MacOS/com.docker.diagnose check;uname -a;system_profiler SPHardwareDataType;echo "::error::-- Wait docker start $i s too long, exit"; exit 1; fi
done
echo "::notice::-- Docker is ready.Wait time is $i s"
uname -a || true
system_profiler SPHardwareDataType || true
`,
        ]);
        core.endGroup();
        core.startGroup("docker version");
        await exec("docker", ["version"]);
        core.endGroup();
        core.startGroup("docker info");
        await exec("docker", ["info"]);
        core.endGroup();
        await core.group("set up buildx", buildx);
        return;
    }
}
