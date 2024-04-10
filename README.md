# About

[![Setup FluentCI](https://github.com/fluentci-io/setup-fluentci/actions/workflows/setup.yml/badge.svg)](https://github.com/fluentci-io/setup-fluentci/actions/workflows/setup.yml)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-setup--fluentci-blue?logo=github&style)](https://github.com/marketplace/actions/setup-fluentci)

Github Action for [FluentCI](https://fluentci.io) - a simple CI/CD tool built for developers. With FluentCI you can write your CI/CD pipelines in TypeScript and run them on your local machine, on your own server or in the cloud.

## Usage

Basic usage:

```yaml
name: fluentci

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: FluentCI
        uses: fluentci-io/setup-fluentci@v5
        with:
          dagger-version: 0.11.0
      - name: Run Hello World
        run: fluentci run base_pipeline
```

With a WebAssembly Plugin:

```yaml
name: Setup FluentCI With Args

on:
  push:
    branches:
      - main

jobs:
  setup-fluentci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup FluentCI
        uses: fluentci-io/setup-fluentci@v5
        with:
          wasm: true # set to true so WebAssembly plugins can be used
          pipeline: base_pipeline # Name of the Wasm Plugin, 
          # will be downloaded from the registry https://pkg.fluentci.io

          # Arguments to pass to the plugin: function_name args
          args: |
            hello Tsiry Sandratraina
            hello again
```

## Inputs

| Key            | Description                             | Default |
| -------------- | --------------------------------------- | ------- |
| dagger-version | The version of the Dagger Engine to use | 0.11.0  |
| pipeline       | The pipeline (module) to execute                   |         |
| wasm           | Run the WebAssembly version of the pipeline (if available) |    |
| args     | Arguments to pass to the pipeline |         |


## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)