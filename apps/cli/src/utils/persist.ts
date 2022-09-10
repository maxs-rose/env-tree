import { mkdirSync, readFileSync, rm, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'os';

export const saveAuthToken = (authToken: string) => {
  try {
    // Throws if dir exists
    mkdirSync(join(tmpdir(), 'envtree'));
  } catch {}

  writeFileSync(join(tmpdir(), 'envtree', 'authTokens.json'), JSON.stringify({ token: authToken }), {
    encoding: 'utf-8',
    flag: 'w+',
  });
};

export const getAuthToken = (): string | undefined => {
  try {
    const file = readFileSync(join(tmpdir(), 'envtree', 'authTokens.json'), { encoding: 'utf-8' });

    return JSON.parse(file).token;
  } catch {
    return undefined;
  }
};

export const deleteAuthToken = () => {
  rm(join(tmpdir(), 'envtree'), { force: true, recursive: true }, () => {});
};
