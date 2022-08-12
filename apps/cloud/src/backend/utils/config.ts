import { decryptConfig } from '@backend/utils/crypt';
import { Config as PrismaConfig } from '@prisma/client';
import { Config, ConfigValue } from '@utils/types';

type PrismaConfigWithParent = PrismaConfig & { linkedParent: PrismaConfig | null };

export const transformConfigs = (config: PrismaConfigWithParent[]) => config.map(transformConfigWithParent);

export const transformConfigWithParent = (config: PrismaConfigWithParent): Config => {
  return {
    ...config,
    linkedParent: config.linkedParent ? transformConfig(config.linkedParent) : null,
    values: transformConfigValues(config.values),
  };
};

export const transformConfig = (config: PrismaConfig): Config => {
  return { ...config, values: transformConfigValues(config.values) } as Config;
};

export const transformConfigValues = (values: string): ConfigValue => decryptConfig(values);

export const configToEnvString = (config: ConfigValue) => {
  return Object.entries(config)
    .map(([k, v]) => `${k}=${v.value}`)
    .join('\n');
};

export const configToJsonObject = (config: ConfigValue) => {
  return Object.fromEntries(Object.entries(config).map(([k, v]) => [k, v.value ?? '']));
};
