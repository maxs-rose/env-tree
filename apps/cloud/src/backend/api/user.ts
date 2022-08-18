import { prisma } from '@backend/prisma';
import * as crypto from 'crypto';
import { from } from 'rxjs';

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
      select: { id: true, email: true, name: true, image: true, authToken: true },
    })
  );

export const generateAuthToken$ = (userId: string) => {
  const authToken = crypto.randomBytes(32).toString('hex');

  return from(prisma.user.update({ where: { id: userId }, data: { authToken } }));
};
