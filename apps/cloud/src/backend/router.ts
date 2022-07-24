import { prisma } from '@backend/prisma';
import { transformConfigs } from '@backend/utils/config';
import { encryptConfig } from '@backend/utils/crypt';
import * as trpc from '@trpc/server';
import { z } from 'zod';

export const appRouter = trpc
  .router()
  .mutation('createProject', {
    input: z.object({ name: z.string().min(3) }),
    resolve: async (data) => {
      const res = await prisma.project.findFirst({
        where: { name: data.input.name },
      });

      if (res) {
        throw new trpc.TRPCError({
          code: 'CONFLICT',
          message: 'Project already exists',
        });
      }

      return await prisma.project.create({ data: { name: data.input.name }, select: { id: true, name: true } });
    },
  })
  .query('projects', {
    resolve: async () => await prisma.project.findMany(),
  })
  .query('config', {
    input: z.object({ id: z.string() }),
    resolve: async (data) => transformConfigs(await prisma.config.findMany({ where: { projectId: data.input.id } })),
  })
  .mutation('createConfig', {
    input: z.object({ projectId: z.string(), configName: z.string() }),
    resolve: async ({ input }) => {
      await prisma.config.create({ data: { projectId: input.projectId, name: input.configName, values: '' } });
    },
  })
  .mutation('deleteConfig', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: async ({ input }) => {
      await prisma.config.delete({ where: { id_projectId: { projectId: input.projectId, id: input.configId } } });
    },
  })
  .mutation('updateConfig', {
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
  });

export type AppRouter = typeof appRouter;
