import { prisma } from '@backend/prisma';
import { notFoundError, projectNotFoundError, trpcError, unauthorizedError } from '@utils/backend/trpcErrorHelpers';
import { combineLatest, from, map, of, switchMap } from 'rxjs';

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
        throw notFoundError('User was not found');
      }

      if (targetUser.UsersOnProject.some((p) => p.projectId === projectId)) {
        throw trpcError('CONFLICT', 'User already added to project');
      }

      return prisma.userAddRequest.create({ data: { userId: targetUser.id, projectId } });
    })
  );

export const getProjectAddRequests$ = (userId: string) =>
  from(prisma.userAddRequest.findMany({ where: { userId }, include: { project: true } }));

export const getAddRequestForProject$ = (userId: string, projectId: string) =>
  combineLatest([
    from(prisma.usersOnProject.findUnique({ where: { projectId_userId: { projectId, userId: userId } } })),
    from(prisma.userAddRequest.findMany({ where: { projectId }, include: { user: true } })),
  ]).pipe(
    map(([callingUserCanAccess, requests]) => {
      if (!callingUserCanAccess) {
        throw unauthorizedError;
      }

      return requests;
    })
  );

export const acceptProjectRequest$ = (userId: string, requestId: string) =>
  from(prisma.userAddRequest.findUnique({ where: { id: requestId } })).pipe(
    switchMap((request) => {
      if (!request || request.userId !== userId) {
        throw notFoundError('Could not find join request');
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

export const rescindProjectRequest$ = (callingUserId: string, projectId: string, userId: string, requestId: string) =>
  from(prisma.usersOnProject.findUnique({ where: { projectId_userId: { projectId, userId: callingUserId } } })).pipe(
    switchMap((canAccessProject) => {
      if (!canAccessProject) {
        throw unauthorizedError;
      }

      return prisma.userAddRequest.deleteMany({ where: { userId, id: requestId } });
    })
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
        throw projectNotFoundError;
      }

      return prisma.usersOnProject.delete({ where: { projectId_userId: { projectId, userId } } });
    })
  );
