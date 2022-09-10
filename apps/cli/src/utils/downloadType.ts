import { InvalidArgumentError } from 'commander';

export type DownloadType = 'env' | 'json' | 'json-grouped';

export const isValidFiletype = (value: string, _: string) => {
  const validOptions = ['env', 'json', 'json-grouped'];
  if (validOptions.some((v) => v === value.toLowerCase())) {
    return value.toLowerCase();
  }

  throw new InvalidArgumentError(`Must be one of ${validOptions}`);
};
