import { configRouter } from '@backend/router/config';
import { projectRouter } from '@backend/router/project';
import * as trpc from '@trpc/server';

export const appRouter = trpc.router().merge('project-', projectRouter).merge('config-', configRouter);

export type AppRouter = typeof appRouter;
