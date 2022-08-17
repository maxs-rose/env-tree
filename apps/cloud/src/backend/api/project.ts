import { prisma } from '@backend/prisma';
import * as trpc from '@trpc/server';
import { combineLatest, EMPTY, from, map, switchMap } from 'rxjs';

export const getProjects$ = (userId: string) =>
  from(prisma.usersOnProject.findMany({ where: { userId }, include: { project: true } })).pipe(
    map((userProjects) => userProjects.map((p) => p.project))
  );

export const createProject$ = (userId: string, name: string) =>
  from(
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

      return prisma.project.create({
        data: { name, UsersOnProject: { create: { userId } } },
        select: { id: true, name: true },
      });
    })
  );

export const deleteProject$ = (userId: string, projectId: string) =>
  from(prisma.project.findFirst({ where: { id: projectId, UsersOnProject: { some: { userId } } } })).pipe(
    map((project) => {
      if (!project) {
        throw new trpc.TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return prisma.project.delete({ where: { id: projectId } });
    })
  );

export const addUser$ = (projectId: string, userEmail: string) => {
  return combineLatest([
    from(prisma.project.findUnique({ where: { id: projectId }, include: { UsersOnProject: true } })),
    from(prisma.user.findUnique({ where: { email: userEmail } })),
  ]).pipe(
    switchMap(([project, user]) => {
      if (!project || !user || project.UsersOnProject.some((u) => u.userId === user.id)) {
        return EMPTY;
      }

      return prisma.usersOnProject.create({ data: { projectId: project.id, userId: user.id } });
    }),
    map((created) => !!created)
  );
};
