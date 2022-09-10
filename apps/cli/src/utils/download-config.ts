import { DownloadType } from '@/utils/downloadType';
import { getUrl } from '@/utils/url';
import chalk from 'chalk';
import fetch, { Response } from 'node-fetch';
import { writeFileSync } from 'node:fs';
import ora, { Ora } from 'ora';

export const downloadConfig = async (
  projectId: string,
  configId: string,
  type: DownloadType,
  url: string,
  auth: { cookie: string } | { email: string; userToken: string },
  filepath: string,
  spinner: Ora = ora()
) => {
  spinner.start(
    `Getting configuration ${chalk.green(configId)} from ${chalk.green(url)} for project ${chalk.green(projectId)}`
  );

  try {
    let fetchResult: Response;

    if ('cookie' in auth) {
      fetchResult = await fetch(getUrl(url, '/api/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
        body: JSON.stringify({ projectId, configId, type }),
      });
    } else {
      fetchResult = await fetch(getUrl(url, '/api/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, configId, type, userEmail: auth.email, userToken: auth.userToken }),
      });
    }

    if (fetchResult.status !== 200) {
      spinner.fail(`Failed to fetch a config with id ${chalk.red(configId)} for project ${chalk.red(projectId)}`);
      return;
    }

    spinner.succeed('Got configuration');
    spinner.start(`Writing secret file to ${filepath}`);

    const parsedResult = (await (type === 'env' ? fetchResult.text() : fetchResult.json())) as string | object;

    try {
      writeFileSync(filepath, type === 'env' ? (parsedResult as string) : JSON.stringify(parsedResult, null, '\t'));
      spinner.succeed();
    } catch (e: any) {
      spinner.fail(`Failed to write file: ${chalk.red(e.message)}`);
    }
  } catch (e: any) {
    spinner.fail(`Failed to fetch config! Error: ${chalk.red(e.errno || e)}`);
  }
};
