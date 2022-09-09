import { saveAuthToken } from '@/utils/persist';
import chalk from 'chalk';
import { Command } from 'commander';
import fetch from 'node-fetch';
import * as http from 'node:http';
import { AddressInfo } from 'node:net';
import open from 'open';
import ora, { Ora } from 'ora';

export const addLogin = (program: Command) => {
  const headers = (origin?: string) => ({
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Max-Age': 2592000, // 30 days
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Authorization',
    'Access-Control-Allow-Origin': origin || 'null',
  });

  const optionsResponse = (res: http.ServerResponse, origin?: string) => {
    res.writeHead(200, headers(origin));
    res.end();
  };

  const handleFailedResponse = (
    svr: http.Server,
    res: http.ServerResponse,
    status: number,
    origin: string | undefined,
    spinner: Ora
  ) => {
    res.writeHead(status, headers(origin));
    res.end();

    spinner.fail(`Failed to login: ${status}`);
    svr.close();
  };

  const getUserData = async (
    svr: http.Server,
    res: http.ServerResponse,
    url: string,
    requestCookie: string,
    origin: string | undefined,
    spinner: Ora
  ) => {
    const userResponse = await fetch(`${url}/api/trpc/user-current`, { headers: { Cookie: requestCookie } });

    res.writeHead(userResponse.status, headers(origin));
    res.end();
    svr.close();

    if (!userResponse.ok) {
      spinner.fail(`Failed to login: ${userResponse.status} (${userResponse.statusText})`);
    }

    const userJson = (await userResponse.json()) as { result: { data: { name: string; email: string } } };

    spinner.succeed(
      `Logged in as ${chalk.green(userJson.result.data.name)} (${chalk.green.italic(userJson.result.data.email)})`
    );
    spinner.start('Saving authorization token');

    try {
      await saveAuthToken(requestCookie);

      spinner.succeed('Saved authorization token');
    } catch {
      spinner.fail(`${chalk.red.bold('Failed')} to save authorization token!`);
    }
  };

  program
    .command('login')
    .description('Login a user to the cli')
    .option('-u, --url <url>', 'URL of Env Tree', 'https://www.envtree.net')
    .action((opts: { url: string }) => {
      let spinner = ora('Opening browser to login').start();
      const url = opts.url;

      const svr = http
        .createServer((req, res) => {
          const origin = req.headers.origin;

          if (req.method?.toLowerCase() === 'options') {
            optionsResponse(res, origin);
            return;
          } else if (req.method?.toLowerCase() === 'get') {
            const requestCookie = req.headers.authorization;

            if (!requestCookie) {
              handleFailedResponse(svr, res, 500, origin, spinner);
              return;
            }

            getUserData(svr, res, url, requestCookie, origin, spinner);
          }
        })
        .listen(0, () => {
          open(`${url}/user/login?cliCallback=http://localhost:${(svr.address() as AddressInfo).port}/clilogin`).then(
            () => {
              spinner.succeed('Browser opened please login');
              spinner.start('Awaiting login response');
            }
          );
        });
    });
};
