import { prisma } from '@backend/prisma';
import { projectWithUserIcons } from '@utils/backend/project';
import { projectNotFoundError } from '@utils/backend/trpcErrorHelpers';
import { from, map, switchMap } from 'rxjs';

export const getProjects$ = (userId: string) =>
  from(
    prisma.usersOnProject.findMany({
      where: { userId },
      include: {
        project: { include: { UsersOnProject: { include: { user: { select: { image: true, email: true } } } } } },
      },
    })
  ).pipe(
    map((userProjects) => userProjects.map((p) => p.project)),
    map((projects) => projects.map(projectWithUserIcons))
  );

export const getSingleProject$ = (userId: string, projectId: string) =>
  from(
    prisma.usersOnProject.findUnique({ where: { projectId_userId: { userId, projectId } }, include: { project: true } })
  ).pipe(
    map((data) => {
      if (!data) {
        throw projectNotFoundError;
      }

      return data.project;
    })
  );

export const createProject$ = (userId: string, name: string, description: string | null) =>
  from(
    prisma.project.create({
      data: { name, description, UsersOnProject: { create: { userId } } },
      select: { id: true, name: true, description: true },
    })
  );

export const updateProject$ = (userId: string, projectId: string, name: string, description: string | null) =>
  from(
    prisma.usersOnProject.findUnique({
      where: { projectId_userId: { userId, projectId } },
    })
  ).pipe(
    switchMap((data) => {
      if (!data) {
        throw projectNotFoundError;
      }

      return prisma.project.update({ data: { name, description }, where: { id: projectId } });
    })
  );

export const deleteProject$ = (userId: string, projectId: string) =>
  from(prisma.project.findFirst({ where: { id: projectId, UsersOnProject: { some: { userId } } } })).pipe(
    map((project) => {
      if (!project) {
        throw projectNotFoundError;
      }

      return prisma.project.delete({ where: { id: projectId } });
    })
  );
