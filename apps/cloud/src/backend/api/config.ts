import { prisma } from '@backend/prisma';
import { configToEnvString, configToJsonObject, PrismaConfigWithParent, transformConfigs } from '@backend/utils/config';
import { decryptConfig, encryptConfig } from '@backend/utils/crypt';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { Config as PrismaConfig } from '@prisma/client';
import * as trpc from '@trpc/server';
import { flattenConfigValues } from '@utils/config';
import { ConfigValue } from '@utils/types';
import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession, User } from 'next-auth';
import { firstValueFrom, from, map, Observable, switchMap } from 'rxjs';
import { z } from 'zod';

const expandConfig = (config: PrismaConfig, projectConfigs: PrismaConfig[]) => {
  // Create a new object so we don't edit the original
  const result = { ...config } as PrismaConfigWithParent;

  // If it's a linked config try to find its parent
  // If the parent is not found set the linked parent to null
  if (config.linkedConfigId) {
    const parentConfig = projectConfigs.find((c) => c.id === config.linkedConfigId);

    if (parentConfig) {
      // Expand the parents parent configs
      const expandedParent = expandConfig(parentConfig, projectConfigs);
      result.linkedParent = expandedParent ?? null;
    } else {
      result.linkedParent = null;
    }
  }

  return result;
};

export const getExpandedConfigs$ = (userId: string, projectId: string) =>
  from(
    prisma.usersOnProject.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: { project: { include: { configs: true } } },
    })
  ).pipe(
    map((res) => {
      if (!res) {
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized for project' });
      }

      return res.project.configs;
    }),
    map((configs) => {
      return configs.map((config) => expandConfig(config, configs));
    }),
    map(transformConfigs)
  );

export const createConfig = async (projectId: string, configName: string) =>
  prisma.config.create({ data: { projectId, name: configName, values: '' } });

export const duplicateConfig$ = (projectId: string, targetConfigId: string, configName: string) =>
  from(
    prisma.config.findUnique({
      where: { id_projectId: { projectId, id: targetConfigId } },
      include: { linkedParent: true },
    })
  ).pipe(
    map((config) => {
      if (!config) {
        throw new trpc.TRPCError({ code: 'NOT_FOUND', message: 'Target config to duplicate was not found' });
      }

      return { ...config, values: decryptConfig(config.values) };
    }),
    map((config) => ({ ...config, values: encryptConfig(config.values) })),
    switchMap((config) =>
      prisma.config.create({
        data: {
          projectId,
          name: configName,
          values: config.values,
          linkedConfigId: config.linkedConfigId,
          linkedProjectConfigId: config.linkedProjectConfigId,
        },
      })
    )
  );

export const linkedConfig = async (projectId: string, targetConfigId: string, configName: string) =>
  prisma.config.create({
    data: {
      projectId,
      name: configName,
      values: '',
      linkedProjectConfigId: projectId,
      linkedConfigId: targetConfigId,
    },
  });

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
  userId: string,
  projectId: string,
  configId: string,
  type: T
): Observable<ConfigExportType<T> | undefined> =>
  getExpandedConfigs$(userId, projectId).pipe(
    map((configs) => configs.find((c) => c.id === configId)),
    map((config) => {
      if (!config) {
        return undefined;
      }

      const flatValues = flattenConfigValues(config);

      switch (type) {
        case 'env':
          return configToEnvString(flatValues) as ConfigExportType<T>;
        case 'json':
          return configToJsonObject(flatValues) as ConfigExportType<T>;
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

  const user = (await unstable_getServerSession(req, res, authOptions))?.user as (User & { id: string }) | null;

  if (!user) {
    res.status(401).send({});
    return;
  }

  const parseResult = zFormData.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).send(parseResult.error.issues);
    return;
  }

  const formData = parseResult.data;

  return await firstValueFrom(exportConfig$(user.id, formData.projectId, formData.configId, formData.type))
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
