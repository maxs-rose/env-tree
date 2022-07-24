import * as trpc from '@trpc/server';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// 32 characters of padding to ensire we always have 1 block of padding
const padding = '................................';

const getCipher = (encrypt = true, presetIv?: string) => {
  const password = process.env.CONFIG_ENCRYPTION_SCRET;
  const saltBytes = process.env.SALT_BYTES;
  const ivBytes = process.env.IV_BYTES;

  if (!password || !saltBytes || !ivBytes) {
    throw new trpc.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create cipher' });
  }

  const salt = Buffer.from(saltBytes.replaceAll(' ', ''), 'hex');
  const iv = presetIv ? Buffer.from(presetIv, 'hex') : randomBytes(16);

  const key = scryptSync(password, salt, 24);
  const algorithm = 'aes-192-cbc';
  return {
    cipher: encrypt ? createCipheriv(algorithm, key, iv) : createDecipheriv(algorithm, key, iv),
    iv: iv.toString('hex'),
  };
};

export const encryptConfig = (config: object): string => {
  const strigified = `${JSON.stringify(config)}${padding}`;
  const { cipher, iv } = getCipher();

  return `${cipher.update(strigified, 'utf-8', 'hex') as string}-${iv}`;
};

export const decryptConfig = (config: string): object => {
  if (!config) {
    return {};
  }

  const [cipherText, iv] = config.split('-');

  const { cipher } = getCipher(false, iv);

  const result = (cipher.update(cipherText, 'hex', 'utf-8') as string).replace(/}\.+$/, '}');

  return JSON.parse(result || '{}');
};
