import { InvalidArgumentError } from 'commander';
import { URLSearchParams } from 'node:url';

export const validURL = (candidateUrl: string, _: string) => {
  const url = candidateUrl.trim();
  const urlRegex = /^(https?):\/\/[A-Za-z:\d.]+$/;

  if (urlRegex.test(url)) {
    return url;
  }

  throw new InvalidArgumentError(`Must match ${urlRegex}`);
};

export const getUrl = (host: string, endpiont: string, query?: Record<string, string>) => {
  const url = new URL(endpiont, host).href;

  if (query) {
    return `${url}?${new URLSearchParams(query)}`;
  }

  return url;
};
