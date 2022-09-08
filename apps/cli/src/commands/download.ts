import { FileType } from '@/utils/fileType';
import { getAuthToken } from '@/utils/persist';
import chalk from 'chalk';
import { Command } from 'commander';
import { writeFileSync } from 'fs';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import { exit } from 'node:process';
import { URLSearchParams } from 'node:url';
import ora from 'ora';

export const addDownload = (program: Command) => {
  const getProjectList = (url: string, authToken: string): Promise<Array<{ name: string; value: string }>> => {
    return fetch(`${url}/api/trpc/project-get`, { headers: { Cookie: authToken } })
      .then((data): Promise<{ result: { data: Array<{ id: string; name: string }> } }> => {
        if (!data.ok) {
          ora().fail(`Could not get list of user projects. Response: ${data.status}`);
          exit();

          return Promise.resolve({ result: { data: [] } });
        }

        return data.json() as Promise<{ result: { data: Array<{ id: string; name: string }> } }>;
      })
      .then((data) => data.result.data.map((d) => ({ name: d.name, value: d.id })));
  };

  const getConfigList = (
    url: string,
    authToken: string,
    projectId: string
  ): Promise<Array<{ name: string; value: string }>> => {
    const searchObject = { input: JSON.stringify({ projectId }) };

    return fetch(`${url}/api/trpc/config-get?${new URLSearchParams(searchObject)}`, {
      headers: { Cookie: authToken },
    })
      .then((data): Promise<{ result: { data: Array<{ id: string; name: string }> } }> => {
        if (!data.ok) {
          ora().fail(`Could not get list of user projects. Response: ${data.status}`);
          exit();

          return Promise.resolve({ result: { data: [] } });
        }

        return data.json() as Promise<{ result: { data: Array<{ id: string; name: string }> } }>;
      })
      .then((data) => data.result.data.map((d) => ({ name: d.name, value: d.id })));
  };

  program
    .command('download')
    .description('Download a configuration file for a project')
    .option('-u, --url <url>', 'URL of Env Tree', 'https://www.envtree.net')
    .action(async (opts: { url: string }) => {
      const authToken = getAuthToken();

      if (!authToken) {
        ora().fail('User is not logged in');
        return;
      }

      let spinner = ora().start('Getting projects');
      const projectList = await getProjectList(opts.url, authToken);
      spinner.succeed();

      const { project } = await inquirer.prompt<{ project: string }>([
        { name: 'project', type: 'list', message: 'Please choose a project:', choices: projectList },
      ]);

      spinner.start('Getting config list for project');
      const configList = await getConfigList(opts.url, authToken, project);
      spinner.succeed();

      const { config } = await inquirer.prompt<{ config: string }>([
        { name: 'config', type: 'list', message: 'Please choose a configuration:', choices: configList },
      ]);

      const { dlType } = await inquirer.prompt<{ dlType: FileType }>([
        {
          name: 'dlType',
          type: 'list',
          message: 'Please choose a download type:',
          choices: [
            { name: 'env', value: 'env' },
            { name: 'json', value: 'json' },
            { name: 'json grouped', value: 'json-grouped' },
          ],
          default: 'env',
        },
      ]);

      const { filename } = await inquirer.prompt<{ filename: string }>([
        {
          name: 'filename',
          type: 'input',
          default: dlType === 'env' ? '.env' : 'secrets.json',
        },
      ]);

      spinner.start('Downloading configuration');
      const formData = JSON.stringify({ projectId: project, configId: config, type: dlType });

      fetch(new URL('/api/config', opts.url).href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: authToken },
        body: formData,
      })
        .catch((e) => {
          spinner.fail(`Failed to fetch config! Error: ${chalk.red(e.errno)}`);

          exit(1);
        })
        .then((res) => {
          if (res.status !== 200) {
            spinner.fail(`Failed to fetch a config with id ${chalk.red(config)} for project ${chalk.red(project)}`);

            exit(1);
          }

          return res;
        })
        .then((res) => (dlType === 'env' ? res.text() : res.json()) as string | object)
        .then((data) => {
          spinner.succeed('Got configuration');

          spinner.start(`Writing secret file to ./${filename}`);
          return data;
        })
        .then((data) => {
          try {
            writeFileSync(`./${filename}`, dlType === 'env' ? (data as string) : JSON.stringify(data, null, '\t'));
            spinner.succeed();
          } catch (e: any) {
            spinner.fail(`Failed to write file: ${chalk.red(e.message)}`);

            exit(1);
          }
        });
    });
};
