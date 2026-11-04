import { beforeEach, expect, mock, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";

const exec = mock(async (..._args: any[]) => 0);
const getExecOutput = mock(async (..._args: any[]) => ({
  exitCode: 0,
  stdout: "fluentci 2026.11.04\n",
  stderr: "",
}));
const addPath = mock((..._args: any[]) => {});
mock.module("@actions/exec", () => ({ exec, getExecOutput }));
mock.module("@actions/core", () => ({ addPath }));
const { default: setup } = await import("../src/setup");
const defaults = { wasm: false, pipeline: "", args: [], workdir: "." };
const binary = join(homedir(), ".local", "bin", "fluentci");

beforeEach(() => {
  exec.mockClear();
  getExecOutput.mockClear();
  addPath.mockClear();
});

test("curl install only, explicit version is passed as environment data", async () => {
  const version = "2026.11.04";
  expect(await setup({ ...defaults, version })).toEqual({
    version: "fluentci 2026.11.04",
  });
  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec.mock.calls[0][0]).toBe("bash");
  expect(exec.mock.calls[0][1]).toEqual([
    "-o",
    "pipefail",
    "-c",
    "curl -fsSL https://raw.githubusercontent.com/tsirysndr/fluentci/main/install.sh | sh",
  ]);
  expect(exec.mock.calls[0][2].env.FLUENTCI_VERSION).toBe(version);
  expect(exec.mock.calls[0][2].env.FLUENTCI_INSTALL_DIR).toBe(
    join(homedir(), ".local", "bin")
  );
  expect(addPath).toHaveBeenCalledWith(join(homedir(), ".local", "bin"));
  expect(getExecOutput).toHaveBeenCalledWith(binary, ["--version"]);
});

test("local modules use run without wasm and preserve quoted arguments", async () => {
  await setup({
    ...defaults,
    pipeline: "main",
    workdir: "project dir",
    args: ['hello "Tsiry Sandratraina"', "hello again"],
  });
  expect(exec.mock.calls.slice(1)).toEqual([
    [
      binary,
      [
        "run",
        "--work-dir",
        "project dir",
        "main",
        "hello",
        "Tsiry Sandratraina",
      ],
    ],
    [binary, ["run", "--work-dir", "project dir", "main", "hello", "again"]],
  ]);
});

test("Wasm plugin selection and arguments-only runs", async () => {
  await setup({ ...defaults, wasm: true, args: ["rust test"] });
  expect(exec.mock.calls[1]).toEqual([
    binary,
    ["run", "--wasm", "--work-dir", ".", "rust", "test"],
  ]);
});

test("pipeline alone runs its default jobs", async () => {
  await setup({ ...defaults, pipeline: "." });
  expect(exec.mock.calls[1]).toEqual([binary, ["run", "--work-dir", ".", "."]]);
});

test("shell operators cannot run extra commands", async () => {
  await expect(
    setup({ ...defaults, args: ["main hello; touch surprise"] })
  ).rejects.toThrow("shell operators");
  expect(exec).toHaveBeenCalledTimes(1);
});

test("installation failures stop before version verification", async () => {
  exec.mockRejectedValueOnce(new Error("download failed"));
  await expect(setup(defaults)).rejects.toThrow("download failed");
  expect(getExecOutput).not.toHaveBeenCalled();
});

test("version verification failures stop before pipeline execution", async () => {
  getExecOutput.mockRejectedValueOnce(new Error("binary failed"));
  await expect(setup({ ...defaults, pipeline: "main" })).rejects.toThrow(
    "binary failed"
  );
  expect(exec).toHaveBeenCalledTimes(1);
});
