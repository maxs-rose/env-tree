import { prisma } from '@backend/prisma';
import { configToEnvString, configToJsonObject, PrismaConfigWithParent, transformConfigs } from '@backend/utils/config';
import { encryptConfig } from '@backend/utils/crypt';
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

const getProjectConfig$ = (userId: string, projectId: string, configId: string) =>
  from(
    prisma.usersOnProject.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: { project: { include: { configs: { include: { linkedParent: true } } } } },
    })
  ).pipe(
    map((foundProject) => {
      if (!foundProject) {
        throw new trpc.TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const config = foundProject.project.configs.find((c) => c.id === configId);

      if (!config) {
        throw new trpc.TRPCError({ code: 'NOT_FOUND', message: 'Target config was not found on project' });
      }

      return config;
    })
  );

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

export const createConfig$ = (userId: string, projectId: string, configName: string) =>
  from(
    prisma.usersOnProject.findUnique({ select: { project: true }, where: { projectId_userId: { projectId, userId } } })
  ).pipe(
    switchMap((foundProject) => {
      if (!foundProject) {
        throw new trpc.TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized for project' });
      }

      return prisma.config.create({ data: { projectId, name: configName, values: '' } });
    })
  );

export const duplicateConfig$ = (userId: string, projectId: string, targetConfigId: string, configName: string) =>
  getProjectConfig$(userId, projectId, targetConfigId).pipe(
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

export const linkedConfig$ = (userId: string, projectId: string, targetConfigId: string, configName: string) =>
  getProjectConfig$(userId, projectId, targetConfigId).pipe(
    switchMap(() =>
      prisma.config.create({
        data: {
          projectId,
          name: configName,
          values: '',
          linkedProjectConfigId: projectId,
          linkedConfigId: targetConfigId,
        },
      })
    )
  );

export const updateConfig$ = (userId: string, projectId: string, configId: string, configValue: ConfigValue) =>
  getProjectConfig$(userId, projectId, configId).pipe(
    switchMap(() =>
      prisma.config.update({
        where: { id_projectId: { id: configId, projectId: projectId } },
        data: { values: encryptConfig(configValue) },
      })
    )
  );

export const deleteConfig$ = (userId: string, projectId: string, configId: string) =>
  getProjectConfig$(userId, projectId, configId).pipe(
    switchMap(() =>
      prisma.config.delete({
        where: {
          id_projectId: {
            projectId,
            id: configId,
          },
        },
      })
    )
  );

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
  userEmail: z.string().optional(),
  userToken: z.string().optional(),
});

const getUserFromSessionOrRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  const userSession = (await unstable_getServerSession(req, res, authOptions))?.user as (User & { id: string }) | null;
  const parseResult = zFormData.safeParse(req.body);

  if (!userSession && !parseResult.success) {
    return 401;
  }

  if (userSession) {
    return userSession;
  }

  if (parseResult.success) {
    const dbUser = await prisma.user.findUnique({
      where: {
        email_authToken: { email: parseResult.data.userEmail ?? '', authToken: parseResult.data.userToken ?? '' },
      },
    });

    if (dbUser) {
      return dbUser as { id: string };
    }
  }

  return 401;
};

export const handleConfigExport = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).send({});
    return;
  }

  const user = await getUserFromSessionOrRequest(req, res);

  if (user === 401) {
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
