import { mkdirSync } from 'fs';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'os';

export const saveAuthToken = (authToken: string) => {
  mkdirSync(join(tmpdir(), 'envtree'));

  return writeFile(join(tmpdir(), 'envtree', 'authTokens.json'), JSON.stringify({ token: authToken }), {
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
