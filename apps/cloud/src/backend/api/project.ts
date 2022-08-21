import { prisma } from '@backend/prisma';
import * as trpc from '@trpc/server';
import { combineLatest, from, map, of, switchMap } from 'rxjs';

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

export const addUserToProjectRequest$ = (callingUserId: string, projectId: string, userEmail: string) =>
  combineLatest([
    from(prisma.usersOnProject.findUnique({ where: { projectId_userId: { projectId, userId: callingUserId } } })),
    from(prisma.user.findUnique({ where: { email: userEmail }, include: { UsersOnProject: true } })),
  ]).pipe(
    switchMap(([callingUserCanAccess, targetUser]) => {
      if (!callingUserCanAccess) {
        throw new trpc.TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User does not have access to this project',
        });
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

export const removeUser$ = (callingUserId: string, projectId: string, userEmail: string) =>
  combineLatest([
    from(prisma.usersOnProject.findUnique({ where: { projectId_userId: { projectId, userId: callingUserId } } })),
    from(
      prisma.user.findUnique({
        where: { email: userEmail },
        include: { UsersOnProject: { include: { project: { include: { UsersOnProject: true } } } } },
      })
    ),
  ]).pipe(
    map(([callingUserProject, user]) => {
      if (!callingUserProject) {
        throw new trpc.TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User does not have access to project',
        });
      }

      if (
        !user ||
        user.UsersOnProject.length === 0 ||
        user.UsersOnProject.length ||
        !user.UsersOnProject.some((p) => p.projectId === projectId)
      ) {
        throw new trpc.TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return user.UsersOnProject.find((p) => p.projectId === projectId)!;
    }),
    switchMap((project) => {
      if (project.project.UsersOnProject.length === 1) {
        throw new trpc.TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Please delete project',
        });
      }

      return prisma.usersOnProject.delete({ where: { projectId_userId: { projectId, userId: project.userId } } });
    })
  );
