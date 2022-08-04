import { prisma } from '@backend/prisma';
import { configToEnvString, transformConfigs, transformConfigValues } from '@backend/utils/config';
import { encryptConfig } from '@backend/utils/crypt';
import * as trpc from '@trpc/server';
import { z } from 'zod';

export const configRouter = trpc
  .router()
  .query('get', {
    input: z.object({ id: z.string() }),
    resolve: async (data) => transformConfigs(await prisma.config.findMany({ where: { projectId: data.input.id } })),
  })
  .mutation('create', {
    input: z.object({ projectId: z.string(), configName: z.string() }),
    resolve: async ({ input }) => {
      await prisma.config.create({ data: { projectId: input.projectId, name: input.configName, values: '' } });
    },
  })
  .mutation('update', {
    input: z.object({ projectId: z.string(), config: z.object({ id: z.string(), values: z.any() }) }),
    resolve: async (data) => {
      const transformedConfigValues = encryptConfig(data.input.config.values);
      const projectId = data.input.projectId;
      const configId = data.input.config.id;

      return await prisma.config.update({
        where: { id_projectId: { id: configId, projectId: projectId } },
        data: { values: transformedConfigValues },
      });
    },
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: async ({ input }) => {
      await prisma.config.delete({ where: { id_projectId: { projectId: input.projectId, id: input.configId } } });
    },
  })
  .query('env', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: async ({ input }) => configToEnvString(input.projectId, input.configId),
  })
  .query('json', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: async ({ input }) => {
      const config = await prisma.config.findUnique({
        where: { id_projectId: { id: input.configId, projectId: input.projectId } },
        select: { values: true },
      });
      if (!config) {
        return '';
      }

      return transformConfigValues(config.values);
    },
  });