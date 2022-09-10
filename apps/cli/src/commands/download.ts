import { defaultUrl } from '@/utils/consts';
import { downloadConfig } from '@/utils/download-config';
import { DownloadType } from '@/utils/downloadType';
import { getAuthToken } from '@/utils/persist';
import { getUrl, validURL } from '@/utils/url';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import { exit } from 'node:process';
import ora, { Ora } from 'ora';

export const addDownload = (program: Command) => {
  const getProjectList = async (
    url: string,
    authToken: string,
    spinner: Ora
  ): Promise<Array<{ name: string; value: string }>> => {
    const configListResponse = await fetch(getUrl(url, '/api/trpc/project-get'), { headers: { Cookie: authToken } });

    if (!configListResponse.ok) {
      spinner.fail(
        `Could not get list of user projects. Response: ${chalk.red(configListResponse.status)} (${chalk.red.italic(
          configListResponse.statusText
        )})`
      );
      exit();

      return [];
    }

    const configList = (await configListResponse.json()) as { result: { data: Array<{ id: string; name: string }> } };
    return configList.result.data.map((d) => ({ name: d.name, value: d.id }));
  };

  const getConfigList = async (
    url: string,
    authToken: string,
    projectId: string,
    spinner: Ora
  ): Promise<Array<{ name: string; value: string }>> => {
    const searchObject = { input: JSON.stringify({ projectId }) };

    const configListResponse = await fetch(getUrl(url, '/api/trpc/config-get', searchObject), {
      headers: { Cookie: authToken },
    });

    if (!configListResponse.ok) {
      spinner.fail(
        `Could not get list of user projects. Response: ${chalk.red(configListResponse.status)} (${chalk.red.italic(
          configListResponse.statusText
        )})`
      );

      exit(1);
      return [];
    }

    const configList = (await configListResponse.json()) as { result: { data: Array<{ id: string; name: string }> } };

    return configList.result.data.map((d) => ({ name: d.name, value: d.id }));
  };

  program
    .command('download')
    .description('Download a configuration file for a project')
    .option('-u, --url <url>', 'URL of Env Tree', validURL, defaultUrl)
    .action(async (opts: { url: string }) => {
      const authToken = getAuthToken();
      let spinner = ora();

      if (!authToken) {
        spinner.fail('User is not logged in');
        return;
      }

      spinner.start('Getting projects');
      const projectList = await getProjectList(opts.url, authToken, spinner);
      spinner.succeed();

      const { project } = await inquirer.prompt<{ project: string }>([
        { name: 'project', type: 'list', message: 'Please choose a project:', choices: projectList },
      ]);

      spinner.start('Getting config list for project');
      const configList = await getConfigList(opts.url, authToken, project, spinner);
      spinner.succeed();

      const { config } = await inquirer.prompt<{ config: string }>([
        { name: 'config', type: 'list', message: 'Please choose a configuration:', choices: configList },
      ]);

      const { dlType } = await inquirer.prompt<{ dlType: DownloadType }>([
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

      await downloadConfig(project, config, dlType, opts.url, { cookie: authToken }, `./${filename}`, spinner);
    });
};
