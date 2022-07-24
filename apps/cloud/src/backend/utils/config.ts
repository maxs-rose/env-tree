import { decryptConfig } from '@backend/utils/crypt';
import { Config as PrismaConfig, Project as PrismaProject } from '@prisma/client';
import { Config, ConfigProject } from '@utils/types';

export const transformConfigProject = (project: PrismaProject & { configs: PrismaConfig[] }): ConfigProject => {
  return { ...project, configs: project.configs.map(transformConfig) };
};

export const transformConfigs = (config: PrismaConfig[]) => config.map(transformConfig);

export const transformConfig = (config: PrismaConfig): Config => {
  return { ...config, values: decryptConfig(config.values) } as Config;
};
