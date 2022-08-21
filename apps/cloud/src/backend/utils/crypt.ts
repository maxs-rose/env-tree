import * as trpc from '@trpc/server';
import { ConfigValue } from '@utils/types';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const algorithm = 'aes-192-cbc';

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

const getDecryptionCipher = (salt: string, iv: string) => {
  const password = process.env.CONFIG_ENCRYPTION_SECRET;

  if (!password) {
    throw new trpc.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create cipher' });
  }

  const key = scryptSync(password, Buffer.from(salt, 'hex'), 24);

  return createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
};

export const encryptConfig = (config: ConfigValue): string => encrypt(JSON.stringify(config));

export const encrypt = (data: string) => {
  const { cipher, salt, iv } = getEncryptionCipher();

  return `${cipher.update(data, 'utf-8', 'hex') + cipher.final('hex')}-${salt}-${iv}`;
};

export const decryptConfig = (config: string): ConfigValue => {
  if (!config) {
    return {};
  }

  return JSON.parse(decrypt(config) || '{}');
};

export const decrypt = (data?: string | null) => {
  if (!data) {
    return '';
  }

  const [cipherText, salt, iv] = data.split('-');
  const cipher = getDecryptionCipher(salt, iv);
  return cipher.update(cipherText, 'hex', 'utf-8') + cipher.final('utf-8');
};
