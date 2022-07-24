import * as trpc from '@trpc/server';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// 32 characters of padding to ensire we always have 1 block of padding
const padding = '................................';
const algorithm = 'aes-192-cbc';

const getCipher = (encrypt = true, presetIv?: string) => {
  const password = process.env.CONFIG_ENCRYPTION_SCRET;
  const salt = process.env.CONFIG_ENCRYPTION_SALT;

  if (!password || !salt) {
    throw new trpc.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create cipher' });
  }

  const iv = presetIv ? Buffer.from(presetIv, 'hex') : randomBytes(16);

  const key = scryptSync(password, salt, 24);
  return {
    cipher: encrypt ? createCipheriv(algorithm, key, iv) : createDecipheriv(algorithm, key, iv),
    iv: iv.toString('hex'),
  };
};

const getEncryptionCipher = () => {
  const password = process.env.CONFIG_ENCRYPTION_SECRET;

  if (!password) {
    throw new trpc.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create cipher' });
  }

  const salt = randomBytes(16);
  const iv = randomBytes(16);

  const key = scryptSync(password, salt, 24);

  return {
    cipher: createCipheriv(algorithm, key, iv),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
  };
};

const getDeEncryptionCipher = (salt: string, iv: string) => {
  const password = process.env.CONFIG_ENCRYPTION_SECRET;

  if (!password) {
    throw new trpc.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create cipher' });
  }

  const key = scryptSync(password, Buffer.from(salt, 'hex'), 24);

  return createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
};

export const encryptConfig = (config: object): string => {
  const strigified = `${JSON.stringify(config)}${padding}`;
  const { cipher, salt, iv } = getEncryptionCipher();

  return `${cipher.update(strigified, 'utf-8', 'hex') as string}-${salt}-${iv}`;
};

export const decryptConfig = (config: string): object => {
  if (!config) {
    return {};
  }

  const [cipherText, salt, iv] = config.split('-');

  const cipher = getDeEncryptionCipher(salt, iv);

  const result = (cipher.update(cipherText, 'hex', 'utf-8') as string).replace(/}\.+$/, '}');

  return JSON.parse(result || '{}');
};
