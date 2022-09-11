export const log = (path: string, type: string, error = false, extra?: any) => {
  // eslint-disable-next-line no-console
  const logger = error ? console.error : console.info;

  logger(`[${new Date().toUTCString()}] - '${type}' '${path}'${extra ? ` | ${extra}` : ''}`);
};
