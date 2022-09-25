import { Config as PrismaConfig } from '@prisma/client';
import { decryptConfig } from '@utils/backend/crypt';
import { Config, ConfigValue } from '@utils/shared/types';

export type PrismaConfigWithParent = PrismaConfig & { linkedParent: PrismaConfig | null };

export const transformConfigs = (config: PrismaConfigWithParent[]) => config.map(transformConfigWithParent);

export const transformConfigWithParent = (config: PrismaConfigWithParent): Config => {
  return {
    ...config,
    linkedParent: config.linkedParent ? transformConfigWithParent(config.linkedParent as PrismaConfigWithParent) : null,
    values: transformConfigValues(config.values),
  };
};

export const transformConfigValues = (values: string): ConfigValue => decryptConfig(values);
