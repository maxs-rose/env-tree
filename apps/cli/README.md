# CLI for usage with envtree.net

Easily download your project configurations from [Env Tree](https://www.envtree.net) from your command line.

When downloading a configuration the `project id`, `config id`, `user email`, and `user access token` must be passed.
Your project and config id can be found below the configuration and your user access token can be found on the user settings page.

Basic usage to download as env file

`envtree project-id config-id user@email.com user-access-token`

Options:

| Option                                   | Effect                                                                                 |
|------------------------------------------|----------------------------------------------------------------------------------------|
| `-env`                                   | Download configuration in env file format (default)                                    |
| `-json`                                  | Download configution in flat json format                                               |
| `-json-grouped`                          | Download configution retaining configuration groupings                                 |
| `-d`, `--download-directory <directory>` | Download location for configuration file (default ".")                                 |
| `-f`, `--filename <name>`                | Filename, default ".env" when `-env` is selected, otherwise default is `secrets.json`  |
| `-u`, `--url <url>`                      | URL of Env Tree (defualt `https://www.envtree.net`)                                    |
