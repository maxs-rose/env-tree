import { createProject, deleteProject, getProjects } from '@backend/api/project';
import * as trpc from '@trpc/server';
import { z } from 'zod';

export const projectRouter = trpc
  .router()
  .query('get', {
    resolve: async () => await getProjects(),
  })
  .mutation('create', {
    input: z.object({ name: z.string().min(3) }),
    resolve: async ({ input }) => await createProject(input.name),
  })
  .mutation('delete', {
    input: z.object({ id: z.string() }),
    resolve: async ({ input }) => await deleteProject(input.id),
  });
