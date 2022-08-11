import { prisma } from '@backend/prisma';
import { configToEnvString, configToJsonObject, transformConfigs, transformConfigValues } from '@backend/utils/config';
import { decryptConfig, encryptConfig } from '@backend/utils/crypt';
import * as trpc from '@trpc/server';
import { ConfigValue } from '@utils/types';

export const getConfigs = async (projectId: string) =>
  prisma.config.findMany({ where: { projectId } }).then(transformConfigs);

export const createConfig = async (projectId: string, configName: string) =>
  prisma.config.create({ data: { projectId, name: configName, values: '' } });

export const duplicateConfig = async (projectId: string, targetConfigId: string, configName: string) =>
  prisma.config
    .findUnique({ where: { id_projectId: { projectId, id: targetConfigId } } })
    .then((config) => {
      if (!config) {
        throw new trpc.TRPCError({ code: 'NOT_FOUND', message: 'Target config to duplicate was not found' });
      }

      return decryptConfig(config.values);
    })
    .then((configValues) => encryptConfig(configValues))
    .then((configValues) => prisma.config.create({ data: { projectId, name: configName, values: configValues } }));

export const updateConfig = async (projectId: string, configId: string, configValue: ConfigValue) =>
  prisma.config.update({
    where: { id_projectId: { id: configId, projectId: projectId } },
    data: { values: encryptConfig(configValue) },
  });

export const deleteConfig = async (projectId: string, configId: string) =>
  prisma.config.delete({
    where: {
      id_projectId: {
        projectId,
        id: configId,
      },
    },
  });

export type ConfigType = 'env' | 'json';
type ConfigExportType<T> = T extends 'env' ? string : T extends 'json' ? { [key: string]: string } : never;

export const exportConfig = async <T extends ConfigType>(
  projectId: string,
  configId: string,
  type: T
): Promise<ConfigExportType<T> | undefined> => {
  const encryptedConfig = await prisma.config.findUnique({
    where: { id_projectId: { id: configId, projectId: projectId } },
    select: { values: true },
  });

  if (!encryptedConfig) {
    return undefined;
  }

  const config = transformConfigValues(encryptedConfig.values);

  switch (type) {
    case 'env':
      return configToEnvString(config) as ConfigExportType<T>;
    case 'json':
      return configToJsonObject(config) as ConfigExportType<T>;
  }
};
