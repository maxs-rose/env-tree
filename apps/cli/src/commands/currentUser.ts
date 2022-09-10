import { defaultUrl } from '@/utils/consts';
import { getAuthToken } from '@/utils/persist';
import { getUrl, validURL } from '@/utils/url';
import chalk from 'chalk';
import { Command } from 'commander';
import fetch from 'node-fetch';
import ora from 'ora';

export const addCurrentUser = (program: Command) => {
  program
    .command('current')
    .description('Display the current user logged into the cli')
    .option('-u, --url <url>', 'URL of Env Tree', validURL, defaultUrl)
    .action(async (opts: { url: string }) => {
      let spinner = ora('Getting user information').start();

      const authToken = getAuthToken();

      if (!authToken) {
        spinner.fail('User is not logged in');
        return;
      }

      try {
        const fetchResult = await fetch(getUrl(opts.url, '/api/trpc/user-current'), { headers: { Cookie: authToken } });

        if (!fetchResult.ok) {
          spinner.fail(`Failed to fetch user data: ${fetchResult.status}`);
          return;
        }

        const fetchJson = (await fetchResult.json()) as { result: { data: { name: string; email: string } } };

        spinner.succeed(
          `Logged in as ${chalk.green(fetchJson.result.data.name)} (${chalk.green.italic(fetchJson.result.data.email)})`
        );
      } catch {
        spinner.fail('Failed to fetch user data');
      }
    });
};
