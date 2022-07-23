import { prisma } from '@backend/prisma';
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
    resolve: async (data) => await prisma.config.findMany({ where: { projectId: data.input.id } }),
  });

export type AppRouter = typeof appRouter;
