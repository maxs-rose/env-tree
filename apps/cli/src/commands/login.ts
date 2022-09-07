import { TypeThis } from '@/utils/typedThis';
import { ChildProcess } from 'child_process';
import { Command } from 'commander';
import * as http from 'http';
import { AddressInfo } from 'net';
import fetch from 'node-fetch';
import open from 'open';
import ora from 'ora';

export const addLogin = (program: Command) => {
  program
    .command('login')
    .option('-u, --url <url>', 'URL of Env Tree', 'https://www.envtree.net')
    .action(function () {
      let spinner = ora('Opening browser to login').stop();

      let openedBrowser: ChildProcess;

      // @ts-ignore
      const typedThis: TypeThis = this;
      const options = typedThis.opts();
      const url = options.url;

      const svr = http
        .createServer((req, res) => {
          const requestCookie = req.headers.cookie;

          fetch(`${url}/api/trpc/user-current`, { headers: { Cookie: requestCookie ?? '' } })
            .then((data) => {
              if (!data.ok) {
                res.writeHead(data.status, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    data: 'Failed to login',
                  })
                );

                spinner.fail('Failed to login');
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    data: 'Logged in',
                  })
                );
              }

              svr.close();
              openedBrowser.kill();

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
            });
        })
        .listen(0, () => {
          open(`${url}/user/login?cliCallback=http://localhost:${(svr.address() as AddressInfo).port}/clilogin`).then(
            (res) => {
              openedBrowser = res;
            }
          );
        });
    });
};
