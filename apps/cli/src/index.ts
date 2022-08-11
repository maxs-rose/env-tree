import chalk from 'chalk';
import { program } from 'commander';
import { writeFileSync } from 'fs';
import fetch from 'node-fetch';
import ora from 'ora';
import { exit } from 'process';

program
  .name('@cloud/secrets CLI')
  .description('CLI tool to download secrets from the cloud')
  .version('0.0.1 - POC')
  .argument('<projectId>', 'ID for project to get config from')
  .argument('<configId>', 'ID for config')
  .option('-env', '.env file format (default)')
  .option('-json', 'JSON file format')
  .option('-dd, --download-directory <directory>', 'Directory to download file to', '.')
  .option('-f, --filename <filename>', 'Filename for created secrets file (default .env)')
  .option('-u, --url <url>', 'URL of secret cloud', 'http://localhost:3000');

program.parse();

type FileType = 'env' | 'json';

const getFilename = (filename: string | undefined, downloadType: FileType) => {
  const trimmedName = filename?.trim();

  if (trimmedName) {
    return trimmedName;
  }
  if (downloadType === 'env') {
    return '.env';
  }
  return 'secrets.json';
};

const [projectId, configId] = program.processedArgs;
const options = program.opts();
const type: FileType = options.Json ? 'json' : 'env';
const filename = getFilename(options.filename, type);
const filepath = `${options.downloadDirectory}/${filename}`;
const url = options.url;

let spinner = ora(
  `Getting configuration ${chalk.green(configId)} from ${chalk.green(url)} for project ${chalk.green(projectId)}`
).start();
const formData = JSON.stringify({ projectId, configId, type });

fetch(`${url}/api/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: formData })
  .catch((e) => {
    spinner.fail(`Failed to fetch config! Error: ${chalk.red(e.errno)}`);

    exit(1);
  })
  .then((res) => {
    if (res.status !== 200) {
      spinner.fail(`Failed to fetch a config with id ${chalk.red(configId)} for project ${chalk.red(projectId)}`);

      exit(1);
    }

    return res;
  })
  .then((res) => (type === 'json' ? res.json() : res.text()) as string | object)
  .then((data) => {
    spinner.succeed('Got configuration');

    spinner.start(`Writing secret file to ${filepath}`);
    return data;
  })
  .then((data) => {
    try {
      writeFileSync(filepath, type === 'json' ? JSON.stringify(data, null, '\t') : (data as string));
      spinner.succeed();
    } catch (e: any) {
      spinner.fail(`Failed to write file: ${chalk.red(e.message)}`);

      exit(1);
    }
  });
