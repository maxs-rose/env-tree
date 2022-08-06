import { prisma } from '@backend/prisma';
import * as trpc from '@trpc/server';

export const getProjects = async () => prisma.project.findMany();

export const createProject = async (name: string) => {
  const res = await prisma.project.findFirst({
    where: { name },
  });

  if (res) {
    throw new trpc.TRPCError({
      code: 'CONFLICT',
      message: 'Project already exists',
    });
  }

  return prisma.project.create({ data: { name }, select: { id: true, name: true } });
};

export const deleteProject = async (id: string) => prisma.project.delete({ where: { id } });
