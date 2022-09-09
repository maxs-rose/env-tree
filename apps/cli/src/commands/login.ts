import { saveAuthToken } from '@/utils/persist';
import { Command } from 'commander';
import * as http from 'http';
import { AddressInfo } from 'net';
import fetch from 'node-fetch';
import open from 'open';
import ora from 'ora';

export const addLogin = (program: Command) => {
  const headers = (origin?: string) => ({
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Max-Age': 2592000, // 30 days
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Authorization',
    'Access-Control-Allow-Origin': origin || 'null',
  });

  program
    .command('login')
    .description('Login a user to the cli')
    .option('-u, --url <url>', 'URL of Env Tree', 'https://www.envtree.net')
    .action((opts: { url: string }) => {
      let spinner = ora('Opening browser to login').start();
      const url = opts.url;

      const svr = http
        .createServer((req, res) => {
          if (req.method?.toLowerCase() === 'options') {
            res.writeHead(200, headers(req.headers.origin));
            res.end();
            return;
          } else if (req.method?.toLowerCase() === 'get') {
            const requestCookie = req.headers.cookie;

            if (!requestCookie) {
              res.writeHead(500, headers(req.headers.origin));
              res.end();

              spinner.fail('Failed to login');
              svr.close();
              return;
            }

            fetch(`${url}/api/trpc/user-current`, {
              headers: { Cookie: requestCookie },
            })
              .then((data) => {
                res.writeHead(data.status, headers(req.headers.origin));
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
          }
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
