import { getAuthToken } from '@/utils/persist';
import { Command } from 'commander';
import fetch from 'node-fetch';
import ora from 'ora';
import { exit } from 'process';

export const addCurrentUser = (program: Command) => {
  program
    .command('current')
    .description('Display the current user logged into the cli')
    .option('-u, --url <url>', 'URL of Env Tree', 'https://www.envtree.net')
    .action((opts: { url: string }) => {
      let spinner = ora('Getting user information').start();

      const authToken = getAuthToken();

      if (!authToken) {
        spinner.fail('User is not logged in');
        return;
      }

      fetch(`${opts.url}/api/trpc/user-current`, { headers: { Cookie: authToken } })
        .then((data) => {
          if (!data.ok) {
            spinner.fail('Failed to fetch user data');
            exit();
            return;
          }

          return data.json() as Promise<{
            result: {
              data: {
                name: string;
                email: string;
              };
            };
          }>;
        })
        .then((result) => {
          spinner.succeed(`Logged in as ${result?.result.data.name} (${result?.result.data.email})`);
        });
    });
};
