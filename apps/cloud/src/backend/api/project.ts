import { prisma } from '@backend/prisma';
import { projectWithUserIcons } from '@backend/utils/project';
import * as trpc from '@trpc/server';
import { combineLatest, from, map, of, switchMap } from 'rxjs';

export const unauthorizedError = new trpc.TRPCError({
  code: 'UNAUTHORIZED',
  message: 'User does not have access to this project',
});

export const getProjects$ = (userId: string) =>
  from(
    prisma.usersOnProject.findMany({
      where: { userId },
      include: { project: { include: { UsersOnProject: { include: { user: { select: { image: true } } } } } } },
    })
  ).pipe(
    map((userProjects) => userProjects.map((p) => p.project)),
    map((projects) => projects.map(projectWithUserIcons))
  );

// TODO: Add project descriptions
export const createProject$ = (userId: string, name: string) =>
  from(
    prisma.project.create({
      data: { name, UsersOnProject: { create: { userId } } },
      select: { id: true, name: true },
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

export const getUsersOnProject$ = (callingUserId: string, projectId: string) =>
  from(prisma.usersOnProject.findUnique({ where: { projectId_userId: { projectId, userId: callingUserId } } })).pipe(
    switchMap((callingUserAccess) => {
      if (!callingUserAccess) {
        throw unauthorizedError;
      }

      return prisma.usersOnProject.findMany({ where: { projectId }, include: { user: true } });
    }),
    map((users) =>
      users.map((u) => ({ id: u.userId, name: u.user.name, image: u.user.image, username: u.user.username }))
    )
  );

export const addUserToProjectRequest$ = (callingUserId: string, projectId: string, userId: string) =>
  combineLatest([
    from(prisma.usersOnProject.findUnique({ where: { projectId_userId: { projectId, userId: callingUserId } } })),
    from(prisma.user.findUnique({ where: { id: userId }, include: { UsersOnProject: true } })),
  ]).pipe(
    switchMap(([callingUserCanAccess, targetUser]) => {
      if (!callingUserCanAccess) {
        throw unauthorizedError;
      }

      if (!targetUser) {
        throw new trpc.TRPCError({
          code: 'NOT_FOUND',
          message: 'User was not found',
        });
      }

      if (targetUser.UsersOnProject.some((p) => p.projectId === projectId)) {
        throw new trpc.TRPCError({
          code: 'CONFLICT',
          message: 'User already added to project',
        });
      }

      return prisma.userAddRequest.create({ data: { userId: targetUser.id, projectId } });
    })
  );

export const getProjectAddRequests$ = (userId: string) =>
  from(prisma.userAddRequest.findMany({ where: { userId }, include: { project: true } }));

export const acceptProjectRequest$ = (userId: string, requestId: string) =>
  from(prisma.userAddRequest.findUnique({ where: { id: requestId } })).pipe(
    switchMap((request) => {
      if (!request || request.userId !== userId) {
        throw new trpc.TRPCError({
          code: 'NOT_FOUND',
          message: 'Could not find join request',
        });
      }

      return prisma.$transaction([
        prisma.usersOnProject.create({ data: { projectId: request.projectId, userId } }),
        prisma.userAddRequest.delete({ where: { id: requestId } }),
      ]);
    }),
    map(([createResult, deleteResult]) => !(!createResult || !deleteResult))
  );

export const denyProjectRequest$ = (userId: string, requestId: string) =>
  from(prisma.userAddRequest.deleteMany({ where: { userId, id: requestId } })).pipe(
    map((removed) => of(removed.count >= 1))
  );

export const removeUser$ = (callingUserId: string, projectId: string, userId: string) =>
  combineLatest([
    from(prisma.usersOnProject.findUnique({ where: { projectId_userId: { projectId, userId: callingUserId } } })),
    from(prisma.usersOnProject.findUnique({ where: { projectId_userId: { projectId, userId: userId } } })),
  ]).pipe(
    map(([callingUserProject, userOnProject]) => {
      if (!callingUserProject) {
        throw unauthorizedError;
      }

      if (!userOnProject) {
        throw new trpc.TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return prisma.usersOnProject.delete({ where: { projectId_userId: { projectId, userId } } });
    })
  );
