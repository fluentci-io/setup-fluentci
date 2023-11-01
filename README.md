# About

Github Action for [FluentCI](https://fluentci.io) - a simple CI/CD tool built for developers. With FluentCI you can write your CI/CD pipelines in TypeScript and run them on your local machine, on your own server or in the cloud.

## Usage

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
      - name: Dagger
        uses: fluentci-io/setup-fluentci@v1
      - name: Run Hello World
        run: fluentci run base_pipeline
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)