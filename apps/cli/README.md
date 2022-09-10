# CLI for usage with envtree.net

Easily download your project configurations from [Env Tree](https://www.envtree.net) from your command line.

## Usage

Login to Env Tree with `envtree login`, then configurations can be downloaded with `envtree download`.

## CI Environment/Browserless usage

When downloading a configuration the `project id`, `config id`, `user email`, and `user access token` must be passed.
Your project and config id can be found below the configuration and your user access token can be found on the user settings page.

Basic usage to download as env file:

`envtree classic project-id config-id user@email.com user-access-token`

Options:

| Option                                   | Effect                                                                                      |
|------------------------------------------|---------------------------------------------------------------------------------------------|
| `--format <fileFormat>`                  | Download configuration file format, one of `env`, `json`, or `json-grouped` (default `env`) |
| `-d`, `--download-directory <directory>` | Download location for configuration file (default `.`)                                      |
| `-f`, `--filename <name>`                | Filename, default `.env` when `--format env`, otherwise `secrets.json`                      |
| `-u`, `--url <url>`                      | URL of Env Tree (default `https://www.envtree.net`)                                         |
