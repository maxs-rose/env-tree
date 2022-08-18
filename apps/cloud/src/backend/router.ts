import { RouterContext } from '@backend/createRouter';
import { configRouter } from '@backend/router/config-router';
import { projectRouter } from '@backend/router/project-router';
import { userRouter } from '@backend/router/user-router';
import * as trpc from '@trpc/server';

export const appRouter = trpc
  .router<RouterContext>()
  .merge('project-', projectRouter)
  .merge('config-', configRouter)
  .merge('user-', userRouter);

export type AppRouter = typeof appRouter;
