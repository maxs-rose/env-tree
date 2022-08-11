import { prisma } from '@backend/prisma';
import * as trpc from '@trpc/server';
import { from, switchMap } from 'rxjs';

export const getProjects = async () => prisma.project.findMany();

export const createProject$ = (name: string) => {
  return from(
    prisma.project.findFirst({
      where: { name },
    })
  ).pipe(
    switchMap((res) => {
      if (res) {
        throw new trpc.TRPCError({
          code: 'CONFLICT',
          message: 'Project already exists',
        });
      }

      return prisma.project.create({ data: { name }, select: { id: true, name: true } });
    })
  );
};

export const deleteProject = async (id: string) => prisma.project.delete({ where: { id } });
