import { prisma } from '@backend/prisma';
import * as trpc from '@trpc/server';
import { z } from 'zod';

export const projectRouter = trpc
  .router()
  .query('get', {
    resolve: async () => await prisma.project.findMany(),
  })
  .mutation('create', {
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
  .mutation('delete', {
    input: z.object({ id: z.string() }),
    resolve: async ({ input }) => await prisma.project.delete({ where: { id: input.id } }),
  });
