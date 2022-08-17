/* eslint-disable no-console */
import { authOptions } from '@pages/api/auth/[...nextauth]';
import * as trpc from '@trpc/server';
import { inferAsyncReturnType } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { unstable_getServerSession, User } from 'next-auth';

export const createRouterContext = async (opt?: trpcNext.CreateNextContextOptions) => {
  const getUser = async () => {
    if (!opt) {
      return null;
    }

    return await unstable_getServerSession(opt.req, opt.res, authOptions);
  };

  const user = await getUser();

  return {
    user: user?.user as (User & { id: string }) | null,
  };
};
export type RouterContext = inferAsyncReturnType<typeof createRouterContext>;

export const createRouter = () =>
  trpc.router<RouterContext>().middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {
        ...ctx,
        // infers that `user` is non-nullable to downstream procedures
        user: ctx.user ?? { id: '' },
      },
    });
  });
