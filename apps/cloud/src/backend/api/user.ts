import { prisma } from '@backend/prisma';
import * as crypto from 'crypto';
import { from, map, of, switchMap } from 'rxjs';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  authToken: string | null;
}

export const getUser$ = (userId: string) =>
  from(
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, username: true, image: true, authToken: true },
    })
  );

export const generateAuthToken$ = (userId: string) => {
  const authToken = crypto.randomBytes(32).toString('hex');

  return from(prisma.user.update({ where: { id: userId }, data: { authToken } }));
};

export const renameUser$ = (userId: string, name: string) =>
  from(prisma.user.update({ data: { name }, where: { id: userId } }));

export const updateUsername$ = (userId: string, username: string) =>
  from(prisma.user.update({ data: { username: username.toLowerCase() }, where: { id: userId } }));

export const deleteUser$ = (userId: string) =>
  from(
    prisma.usersOnProject.findMany({ where: { userId }, include: { project: { include: { UsersOnProject: true } } } })
  ).pipe(
    // Remove the users projects if they are the only user left on it
    map((projects) => projects.filter((p) => p.project.UsersOnProject.length <= 1).map((p) => p.projectId)),
    switchMap((projectsToDelete) => prisma.project.deleteMany({ where: { id: { in: projectsToDelete } } })),
    // Remove user from all projects they are on
    switchMap(() => prisma.usersOnProject.deleteMany({ where: { userId } })),
    // Delete the user
    switchMap(() => prisma.user.delete({ where: { id: userId } }))
  );

export const searchUser$ = (query: string | undefined, projectId: string | undefined) =>
  query
    ? from(
        prisma.user.findMany({
          select: { id: true, name: true, username: true, image: true },
          where: {
            OR: [{ name: { contains: query } }, { username: { contains: query } }],
            // Ensure that the returned users are not already on the project
            UsersOnProject: { none: { projectId: projectId ?? '' } },
            // Ensure that the returned users have not already been quested to be added to be project
            UserAddRequest: { none: { projectId: projectId ?? '' } },
          },
          distinct: ['id'],
          take: 20,
        })
      )
    : of([]);
