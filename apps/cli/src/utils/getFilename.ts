import { DownloadType } from './downloadType';

export const getFilename = (filename: string | undefined, downloadType: DownloadType) => {
  const trimmedName = filename?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  if (downloadType === 'env') {
    return '.env';
  }

  return 'secrets.json';
};
