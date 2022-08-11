import { prisma } from '@backend/prisma';
import { configToEnvString, configToJsonObject, transformConfigs, transformConfigValues } from '@backend/utils/config';
import { decryptConfig, encryptConfig } from '@backend/utils/crypt';
import * as trpc from '@trpc/server';
import { ConfigValue } from '@utils/types';
import { NextApiRequest, NextApiResponse } from 'next';
import { firstValueFrom, from, map, Observable, switchMap } from 'rxjs';
import { z } from 'zod';

export const getConfigs$ = (projectId: string) =>
  from(prisma.config.findMany({ where: { projectId } })).pipe(map(transformConfigs));

export const createConfig = async (projectId: string, configName: string) =>
  prisma.config.create({ data: { projectId, name: configName, values: '' } });

export const duplicateConfig$ = (projectId: string, targetConfigId: string, configName: string) =>
  from(prisma.config.findUnique({ where: { id_projectId: { projectId, id: targetConfigId } } })).pipe(
    map((config) => {
      if (!config) {
        throw new trpc.TRPCError({ code: 'NOT_FOUND', message: 'Target config to duplicate was not found' });
      }

      return decryptConfig(config.values);
    }),
    map(encryptConfig),
    switchMap((confValues) => prisma.config.create({ data: { projectId, name: configName, values: confValues } }))
  );

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

const exportConfig$ = <T extends ConfigType>(
  projectId: string,
  configId: string,
  type: T
): Observable<ConfigExportType<T> | undefined> =>
  from(
    prisma.config.findUnique({
      where: { id_projectId: { id: configId, projectId: projectId } },
      select: { values: true },
    })
  ).pipe(
    map((configValues) => {
      if (!configValues) {
        return undefined;
      }

      const config = transformConfigValues(configValues.values);

      switch (type) {
        case 'env':
          return configToEnvString(config) as ConfigExportType<T>;
        case 'json':
          return configToJsonObject(config) as ConfigExportType<T>;
      }
    })
  );

const zFormData = z.object({
  projectId: z.string().min(1),
  configId: z.string().min(1),
  type: z.union([z.literal('env'), z.literal('json')]),
});

export const handleConfigExport = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).send({});
    return;
  }

  const parseResult = zFormData.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).send(parseResult.error.issues);
    return;
  }

  const formData = parseResult.data;

  return await firstValueFrom(exportConfig$(formData.projectId, formData.configId, formData.type))
    .then((data) => {
      if (data === undefined) {
        res.status(404).send('Could not find config');
        return;
      }

      res.status(200);

      if (formData.type === 'env') {
        res.setHeader('Content-Type', 'plain/text');
        res.send(data ?? '');
      } else {
        res.json(data ?? {});
      }
    })
    .catch(() => {
      res.status(500).send({ message: 'Error when exporting config' });
    });
};
