import { tmpdir } from "node:os";
import * as action from "@actions/core";
import setup from "./setup.js";
if (!process.env.RUNNER_TEMP) {
    process.env.RUNNER_TEMP = tmpdir();
}
setup({
    daggerVersion: action.getInput("dagger-version"),
    wasm: action.getInput("wasm") === "false" ? false : action.getInput("wasm"),
    args: action
        .getInput("args")
        .split("\n")
        .map((arg) => arg.trim())
        .filter((arg) => arg),
    pipeline: action.getInput("pipeline"),
    workdir: action.getInput("working-directory"),
})
    .then(({ version }) => {
    action.setOutput("version", version);
})
    .catch((error) => {
    action.setFailed(error.message);
});
