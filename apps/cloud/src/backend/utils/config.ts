import { prisma } from '@backend/prisma';
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

export const transformConfigValues = (values: string): {} => decryptConfig(values);

export const configToEnvString = async (projectId: string, configId: string) => {
  const config = await prisma.config.findUnique({
    where: { id_projectId: { id: configId, projectId: projectId } },
    select: { values: true },
  });

  if (!config) {
    return '';
  }

  return Object.entries(transformConfigValues(config.values))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
};
