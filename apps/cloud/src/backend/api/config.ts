import { changeLinkConfig, insertValueDiff, renameConfig, unlinkConfig } from '@backend/api/configDiff';
import { getUser$ } from '@backend/api/user';
import { prisma } from '@backend/prisma';
import { Config as PrismaConfig } from '@prisma/client';
import * as trpc from '@trpc/server';
import { PrismaConfigWithParent, transformConfigs } from '@utils/backend/config';
import { decryptObject, encryptObject } from '@utils/backend/crypt';
import {
  configNotFoundError,
  notFoundError,
  projectNotFoundError,
  unauthorizedError,
} from '@utils/backend/trpcErrorHelpers';
import { flattenConfigValues, isLinkCycle } from '@utils/shared/flattenConfig';
import { diff } from '@utils/shared/objectDiff';
import { ConfigValue } from '@utils/shared/types';
import { randomBytes } from 'crypto';
import { combineLatest, from, map, switchMap } from 'rxjs';

const expandConfig = (config: PrismaConfig, projectConfigs: PrismaConfig[], seenIds?: string[]) => {
  // Create a new object so we don't edit the original
  const result = { ...config } as PrismaConfigWithParent;

  // If it's a linked config try to find its parent
  // If the parent is not found set the linked parent to null
  if (config.linkedConfigId) {
    const parentConfig = projectConfigs.find((c) => c.id === config.linkedConfigId);

    // Prevent the function not returning if a cycle does occur
    if (parentConfig && !seenIds?.some((id) => config.id === id)) {
      // Expand the parents parent configs
      const expandedParent = expandConfig(parentConfig, projectConfigs, [...(seenIds ?? []), config.id]);
      result.linkedParent = expandedParent ?? null;
    } else {
      result.linkedParent = null;
    }
  }

  return result;
};

export const getProjectConfig$ = (userId: string, projectId: string, configId: string) =>
  from(
    prisma.usersOnProject.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: { project: { include: { configs: { include: { linkedParent: true } } } } },
    })
  ).pipe(
    map((foundProject) => {
      if (!foundProject) {
        throw projectNotFoundError;
      }

      const config = foundProject.project.configs.find((c) => c.id === configId);

      if (!config) {
        throw notFoundError('Target config was not found on project');
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
        throw unauthorizedError;
      }

      return res.project.configs;
    }),
    map((configs) => configs.map((config) => expandConfig(config, configs))),
    map(transformConfigs)
  );

export const createConfig$ = (userId: string, projectId: string, configName: string) =>
  from(
    prisma.usersOnProject.findUnique({ select: { project: true }, where: { projectId_userId: { projectId, userId } } })
  ).pipe(
    switchMap((foundProject) => {
      if (!foundProject) {
        throw unauthorizedError;
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

export const changeConfigLink$ = (
  userId: string,
  projectId: string,
  configId: string,
  targetConfigId: string,
  configVersion: string
) =>
  combineLatest([
    getProjectConfig$(userId, projectId, configId),
    getExpandedConfigs$(userId, projectId),
    getUser$(userId),
  ]).pipe(
    map(([config, configs, user]) => {
      if (!configs.some((c) => c.id === targetConfigId)) {
        throw configNotFoundError;
      }

      if (isLinkCycle(configId, targetConfigId, configs)) {
        throw new trpc.TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Linking would create a cycle',
        });
      }

      // noinspection JSIgnoredPromiseFromCall
      changeLinkConfig(
        user!.username,
        user?.name || null,
        configId,
        projectId,
        targetConfigId,
        configs.find((c) => c.id === targetConfigId)!.name,
        config.linkedConfigId,
        configs.find((c) => c.id === config.linkedConfigId)?.name || null
      );

      return config;
    }),
    switchMap((config) => {
      if (config.version !== configVersion) {
        throw new trpc.TRPCError({
          code: 'CONFLICT',
          message: 'Config version mismatch',
        });
      }

      return prisma.config.update({
        where: { id_projectId: { id: configId, projectId } },
        data: {
          version: randomBytes(16).toString('hex'),
          linkedProjectConfigId: projectId,
          linkedConfigId: targetConfigId,
        },
      });
    })
  );

export const unlinkConfig$ = (userId: string, projectId: string, configId: string, configVersion: string) => {
  return combineLatest([getExpandedConfigs$(userId, projectId), getUser$(userId)]).pipe(
    map(([configs, user]) => {
      const targetConfig = configs.find((c) => c.id === configId);

      if (!targetConfig) {
        throw configNotFoundError;
      }

      if (targetConfig.version !== configVersion) {
        throw new trpc.TRPCError({
          code: 'CONFLICT',
          message: 'Config version mismatch',
        });
      }

      // noinspection JSIgnoredPromiseFromCall
      unlinkConfig(
        user!.username,
        user?.name || null,
        projectId,
        configId,
        targetConfig.linkedParent!.name,
        targetConfig.linkedConfigId!
      );

      return targetConfig;
    }),
    map(flattenConfigValues),
    map(Object.entries),
    map((values) => {
      return values.map(([k, v]) => {
        // The parent name and overrides don't make sense to exist here
        const { parentName, overrides, ...data } = v;
        return [k, data];
      });
    }),
    map(Object.fromEntries),
    switchMap((values) =>
      prisma.config.update({
        where: { id_projectId: { id: configId, projectId: projectId } },
        data: {
          values: encryptObject(values),
          version: randomBytes(16).toString('hex'),
          linkedConfigId: null,
          linkedProjectConfigId: null,
        },
      })
    )
  );
};

export const updateConfig$ = (
  userId: string,
  projectId: string,
  configId: string,
  configVersion: string | null,
  configValue: ConfigValue
) =>
  combineLatest([getProjectConfig$(userId, projectId, configId), getUser$(userId)]).pipe(
    switchMap(([config, user]) => {
      if (config.version !== configVersion) {
        throw new trpc.TRPCError({
          code: 'CONFLICT',
          message: 'Config version mismatch',
        });
      }

      const configDiff = diff(decryptObject(config.values), configValue);

      if (configDiff.length > 1) {
        throw new trpc.TRPCError({
          code: 'BAD_REQUEST',
          message: 'Too Many changes',
        });
      }

      if (configDiff.length) {
        // noinspection JSIgnoredPromiseFromCall
        insertValueDiff(configDiff[0], user!.username, user?.name || null, projectId, configId);
      }

      return prisma.config.update({
        where: { id_projectId: { id: configId, projectId: projectId } },
        data: { values: encryptObject(configValue), version: randomBytes(16).toString('hex') },
      });
    })
  );

export const renameConfig$ = (
  userId: string,
  projectId: string,
  configId: string,
  configVersion: string | null,
  configName: string
) =>
  combineLatest([getProjectConfig$(userId, projectId, configId), getUser$(userId)]).pipe(
    switchMap(([config, user]) => {
      if (config.version !== configVersion) {
        throw new trpc.TRPCError({
          code: 'CONFLICT',
          message: 'Config version mismatch',
        });
      }

      // noinspection JSIgnoredPromiseFromCall
      renameConfig(user!.username, user?.name || null, projectId, configId, config.name, configName);

      return prisma.config.update({
        where: { id_projectId: { id: configId, projectId: projectId } },
        data: { name: configName, version: randomBytes(16).toString('hex') },
      });
    })
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
