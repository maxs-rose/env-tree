import { RouterContext } from '@backend/createRouter';
import { configRouter } from '@backend/router/config-router';
import { projectRouter } from '@backend/router/project-router';
import * as trpc from '@trpc/server';

export const appRouter = trpc.router<RouterContext>().merge('project-', projectRouter).merge('config-', configRouter);

export type AppRouter = typeof appRouter;
