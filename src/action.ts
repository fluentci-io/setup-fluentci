import { tmpdir } from "node:os";
import * as action from "@actions/core";
import setup from "./setup.js";

if (!process.env.RUNNER_TEMP) {
  process.env.RUNNER_TEMP = tmpdir();
}

setup({
  daggerVersion: action.getInput("dagger-version"),
  wasm: action.getInput("wasm") === "false" ? false : action.getInput("wasm"),
  args: action.getInput("args"),
  pipeline: action.getInput("pipeline"),
})
  .then(({ version }) => {
    action.setOutput("version", version);
  })
  .catch((error) => {
    action.setFailed(error.message);
  });
