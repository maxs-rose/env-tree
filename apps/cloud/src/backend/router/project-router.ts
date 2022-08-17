import { addUser$, createProject$, deleteProject$, getProjects$ } from '@backend/api/project';
import { createRouter } from '@backend/createRouter';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';

export const projectRouter = createRouter()
  .query('get', {
    resolve: ({ ctx }) => firstValueFrom(getProjects$(ctx.user.id)),
  })
  .mutation('create', {
    input: z.object({ name: z.string().min(3) }),
    resolve: ({ input, ctx }) => firstValueFrom(createProject$(ctx.user.id, input.name)),
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(deleteProject$(ctx.user.id, input.projectId)),
  })
  .mutation('add-user', {
    input: z.object({ projectId: z.string(), user: z.string().email() }),
    resolve: ({ input }) => firstValueFrom(addUser$(input.projectId, input.user)),
  });
