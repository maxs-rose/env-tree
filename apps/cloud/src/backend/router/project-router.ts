import {
  acceptProjectRequest$,
  addUserToProjectRequest$,
  createProject$,
  deleteProject$,
  denyProjectRequest$,
  getProjectAddRequests$,
  getProjects$,
  removeUser$,
} from '@backend/api/project';
import { createRouter } from '@backend/createRouter';
import * as trpc from '@trpc/server';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';

// TODO: Implement project descriptions

export const projectRouter = createRouter()
  .query('get', {
    resolve: ({ ctx }) => firstValueFrom(getProjects$(ctx.user.id)),
  })
  .mutation('create', {
    input: z.object({ name: z.string().min(3).max(40) }),
    resolve: ({ input, ctx }) => firstValueFrom(createProject$(ctx.user.id, input.name)),
  })
  .mutation('update', {
    input: z.object({ projectId: z.string(), newName: z.string().min(3).max(40) }),
    resolve: ({ ctx, input }) => {
      // TODO: Implement updating project name/description
      throw new trpc.TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Not yet implemented',
      });
    },
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(deleteProject$(ctx.user.id, input.projectId)),
  })
  .mutation('add-user-request', {
    input: z.object({ projectId: z.string(), userEmail: z.string() }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(addUserToProjectRequest$(ctx.user.id, input.projectId, input.userEmail)),
  })
  .query('get-add-requests', {
    resolve: ({ ctx }) => firstValueFrom(getProjectAddRequests$(ctx.user.id)),
  })
  .mutation('accept-request', {
    input: z.object({ requestId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(acceptProjectRequest$(ctx.user.id, input.requestId)),
  })
  .mutation('deny-request', {
    input: z.object({ requestId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(denyProjectRequest$(ctx.user.id, input.requestId)),
  })
  .mutation('remove-user', {
    input: z.object({ projectId: z.string(), userEmail: z.string().email() }),
    resolve: ({ ctx, input }) => firstValueFrom(removeUser$(ctx.user.id, input.projectId, input.userEmail)),
  });
