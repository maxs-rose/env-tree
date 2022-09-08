import { FileType } from './fileType';

export const getFilename = (filename: string | undefined, downloadType: FileType) => {
  const trimmedName = filename?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  if (downloadType === 'env') {
    return '.env';
  }

  return 'secrets.json';
};
