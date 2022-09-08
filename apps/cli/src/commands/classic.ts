import { FileType, isValidFiletype } from '@/utils/fileType';
import { getFilename } from '@/utils/getFilename';
import chalk from 'chalk';
import { Command } from 'commander';
import { writeFileSync } from 'fs';
import fetch from 'node-fetch';
import ora from 'ora';
import { exit } from 'process';

export const addClassic = (program: Command) => {
  program
    .command('classic', { isDefault: true })
    .description(
      'Classic version of Env Tree CLI. Intended for use in CI like environments and is the default if no command is specified'
    )
    .argument('<projectId>', 'ID for project to get config from')
    .argument('<configId>', 'ID for config')
    .argument('<userEmail>', 'User email')
    .argument('<userToken>', 'User auth token')
    .option('--format <fileFormat>', 'File format to download', isValidFiletype, 'env')
    .option('-d, --download-directory <directory>', 'Directory to download file to', '.')
    .option('-f, --filename <filename>', 'Filename for created secrets file (default ".env")')
    .option('-u, --url <url>', 'URL of Env Tree', 'https://www.envtree.net')
    .action(
      (
        projectId,
        configId,
        userEmail,
        userToken,
        options: { format: FileType; downloadDirectory: string; filename?: string; url: string }
      ) => {
        const type = options.format;
        const filename = getFilename(options.filename, type);
        const filepath = `${options.downloadDirectory}/${filename}`;
        const url = options.url;

        let spinner = ora(
          `Getting configuration ${chalk.green(configId)} from ${chalk.green(url)} for project ${chalk.green(
            projectId
          )}`
        ).start();
        const formData = JSON.stringify({ projectId, configId, type, userEmail, userToken });

        fetch(new URL('/api/config', url).href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: formData,
        })
          .catch((e) => {
            spinner.fail(`Failed to fetch config! Error: ${chalk.red(e.errno)}`);

            exit(1);
          })
          .then((res) => {
            if (res.status !== 200) {
              spinner.fail(
                `Failed to fetch a config with id ${chalk.red(configId)} for project ${chalk.red(projectId)}`
              );

              exit(1);
            }

            return res;
          })
          .then((res) => (type === 'env' ? res.text() : res.json()) as string | object)
          .then((data) => {
            spinner.succeed('Got configuration');

            spinner.start(`Writing secret file to ${filepath}`);
            return data;
          })
          .then((data) => {
            try {
              writeFileSync(filepath, type === 'env' ? (data as string) : JSON.stringify(data, null, '\t'));
              spinner.succeed();
            } catch (e: any) {
              spinner.fail(`Failed to write file: ${chalk.red(e.message)}`);

              exit(1);
            }
          });
      }
    );
};
