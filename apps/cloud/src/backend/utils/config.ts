import { decryptConfig } from '@backend/utils/crypt';
import { Config as PrismaConfig, Project as PrismaProject } from '@prisma/client';
import { Config, ConfigProject } from '@utils/types';

export const transformConfigProject = (project: PrismaProject & { configs: PrismaConfig[] }): ConfigProject => {
  return { ...project, configs: project.configs.map(transformConfig) };
};

export const transformConfigs = (config: PrismaConfig[]) => config.map(transformConfig);

export const transformConfig = (config: PrismaConfig): Config => {
  return { ...config, values: transformConfigValues(config.values) } as Config;
};

export const transformConfigValues = (values: string): { [key: string]: string } => decryptConfig(values);

export const configToEnvString = (config: { [key: string]: string }) => {
  return Object.entries(config)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
};
