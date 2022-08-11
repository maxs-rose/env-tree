import { createProject$, deleteProject, getProjects } from '@backend/api/project';
import * as trpc from '@trpc/server';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';

export const projectRouter = trpc
  .router()
  .query('get', {
    resolve: () => getProjects(),
  })
  .mutation('create', {
    input: z.object({ name: z.string().min(3) }),
    resolve: ({ input }) => firstValueFrom(createProject$(input.name)),
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ input }) => deleteProject(input.projectId),
  });
