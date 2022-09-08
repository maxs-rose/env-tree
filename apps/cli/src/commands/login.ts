import { saveAuthToken } from '@/utils/persist';
import { Command } from 'commander';
import * as http from 'http';
import { AddressInfo } from 'net';
import fetch from 'node-fetch';
import open from 'open';
import ora from 'ora';

export const addLogin = (program: Command) => {
  program
    .command('login')
    .description('Login a user to the cli')
    .option('-u, --url <url>', 'URL of Env Tree', 'https://www.envtree.net')
    .action((opts: { url: string }) => {
      let spinner = ora('Opening browser to login').start();
      const url = opts.url;

      const svr = http
        .createServer((req, res) => {
          const requestCookie = req.headers.cookie;

          if (!requestCookie) {
            res.writeHead(307, { Location: `${url}/user/cli-login?status=500` });
            res.end();

            spinner.fail('Failed to login');
            return;
          }

          fetch(`${url}/api/trpc/user-current`, { headers: { Cookie: requestCookie } })
            .then((data) => {
              res.writeHead(307, { Location: `${url}/user/cli-login?status=${data.status}` });
              res.end();

              if (!data.ok) {
                spinner.fail(`Failed to login: ${data.status} (${data.statusText})`);
              }

              svr.close();

              return data.json() as Promise<{
                result: {
                  data: {
                    name: string;
                    email: string;
                  };
                };
              }>;
            })
            .then(({ result: user }) => {
              spinner.succeed(`Logged in as ${user.data.name} (${user.data.email})`);
              spinner.start('Saving authorization token');

              return saveAuthToken(requestCookie);
            })
            .then(() => {
              spinner.succeed('Saved authorization token');
            });
        })
        .listen(0, () => {
          open(`${url}/user/login?cliCallback=http://localhost:${(svr.address() as AddressInfo).port}/clilogin`).then(
            () => {
              spinner.info('Browser opened please login');
            }
          );
        });
    });
};
