# Setup FluentCI

GitHub Action to install the [FluentCI CLI](https://github.com/fluentci-io/fluentci)
and optionally run a pipeline, workspace module, or WebAssembly plugin.

The action follows the CLI's curl installation:

```sh
curl -fsSL https://raw.githubusercontent.com/fluentci-io/fluentci/main/install.sh | sh
```

The installer selects the platform archive, verifies its SHA-256 checksum, and
installs the executable into `~/.local/bin`. The action adds that directory to
`PATH` and verifies `fluentci --version`. Linux and macOS runners on x86_64 and
ARM64 are supported; Windows is not supported.

## Usage

Install the CLI, then use any of its commands in subsequent steps:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: fluentci-io/setup-fluentci@next
    with:
      version: 'v0.17.0' # Optional; omit to install the latest release
  - run: fluentci run
```

Run a declared workspace module (no `wasm` flag needed):

```yaml
- uses: fluentci-io/setup-fluentci@next
  with:
    module: main
    args: hello
    working-directory: ./my-project
```

Run a published or compiled WebAssembly plugin:

```yaml
- uses: fluentci-io/setup-fluentci@next
  with:
    wasm: true
    plugin: rust # Or a path to a compiled .wasm file
    args: test
```

Each nonempty `args` line runs separately. Quotes preserve arguments containing
spaces; these lines are CLI arguments and do not execute shell commands:

```yaml
- uses: fluentci-io/setup-fluentci@next
  with:
    module: main
    args: |
      hello "Tsiry Sandratraina"
      hello again
```

To run configured steps, set `pipeline: .` and optionally select a step with
`args: check`. Without a pipeline input, `args` supplies the arguments following
`fluentci run` (for example, `args: main hello`). Without either input, the action
only installs the CLI. For other subcommands, use a subsequent `run` step.

## Inputs

| Key | Description | Default |
| --- | --- | --- |
| version | Exact CLI release tag; also accepts `FLUENTCI_VERSION` from the environment | Latest upstream release |
| pipeline | Declared module, pipeline, registry package, or path to execute | |
| plugin | Alias for `pipeline` | |
| module | Alias for `pipeline` | |
| extension | Alias for `pipeline` | |
| wasm | Pass `--wasm` for published or compiled WebAssembly plugins | `false` |
| args | Arguments following `fluentci run [--wasm] [pipeline]`; one invocation per line | |
| working-directory | Execution directory, passed through `--work-dir` | `.` |

When multiple pipeline aliases are supplied, precedence is `pipeline`, `plugin`,
`module`, then `extension`.

## Outputs

| Key | Description |
| --- | --- |
| version | Full output of `fluentci --version` |

## Migrating from v5

The new CLI embeds its engine and Studio. The `dagger-version` and
`engine-version` inputs have been removed. The action no longer installs Deno,
Dagger, Docker, or a separate engine. If you run legacy TypeScript/Dagger
pipelines, provision their runtime dependencies yourself. Source modules also
need the build tools for their chosen SDK; compiled Wasm plugins do not.

## Development

```sh
bun install --frozen-lockfile
bun test
bun run build
```

Commit the rebuilt `dist/action.cjs` with source changes; GitHub runs this bundle
without installing npm dependencies.

## License

Released under the [MIT License](LICENSE).
