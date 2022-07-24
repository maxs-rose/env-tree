import * as trpc from '@trpc/server';
import { createCipheriv, createDecipheriv, scryptSync } from 'crypto';

const getCipher = (encrypt = true) => {
  const password = process.env.CONFIG_ENCRYPTION_SCRET;
  const saltBytes = process.env.SALT_BYTES;
  const ivBytes = process.env.IV_BYTES;

  if (!password || !saltBytes || !ivBytes) {
    throw new trpc.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create cipher' });
  }

  const salt = Buffer.from(saltBytes.replaceAll(' ', ''), 'hex');
  const iv = Buffer.from(saltBytes.replaceAll(' ', ''), 'hex');

  const key = scryptSync(password, salt, 24);
  const algorithm = 'aes-192-cbc';
  return encrypt ? createCipheriv(algorithm, key, iv) : createDecipheriv(algorithm, key, iv);
};

export const encryptConfig = (config: object): string => {
  const strigified = JSON.stringify(config);
  const cipher = getCipher();

  // Blocks should be of size 16 in length and we need to add padding onto the end
  const chunks = (strigified.match(/.{1,16}/g) ?? []).map((c) => c.padEnd(16, '.'));
  chunks.push(new Array(16).fill('.').join(''));

  return chunks.map((c) => cipher.update(c, 'utf-8', 'hex') as string).join('-');
};

export const decryptConfig = (config: string): object => {
  const cipher = getCipher(false);

  const result = config
    .split('-')
    .filter((c) => c)
    .map((c) => cipher.update(c, 'hex', 'utf-8'))
    .join('')
    .replace(/}\.+$/, '}');

  return JSON.parse(result || '{}');
};
