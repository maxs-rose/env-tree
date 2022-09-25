import { createProject$, deleteProject$, getProjects$, getSingleProject$, updateProject$ } from '@backend/api/project';
import {
  acceptProjectRequest$,
  addUserToProjectRequest$,
  denyProjectRequest$,
  getAddRequestForProject$,
  getProjectAddRequests$,
  getUsersOnProject$,
  removeUser$,
  rescindProjectRequest$,
} from '@backend/api/projectUsers';
import { createRouter } from '@backend/createRouter';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';

export const projectRouter = createRouter()
  .query('get', {
    resolve: ({ ctx }) => firstValueFrom(getProjects$(ctx.user.id)),
  })
  .query('get-single', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(getSingleProject$(ctx.user.id, input.projectId)),
  })
  .mutation('create', {
    input: z.object({
      name: z
        .string()
        .trim()
        .min(3, 'Minimum project name length is 3 characters')
        .max(40, 'Maximum project name length is 40 characters'),
      description: z.string().max(255, 'Maximum description length is 255 characters').nullable(),
    }),
    resolve: ({ input, ctx }) => firstValueFrom(createProject$(ctx.user.id, input.name, input.description)),
  })
  .mutation('update', {
    input: z.object({
      projectId: z.string(),
      name: z
        .string()
        .trim()
        .min(3, 'Minimum project name length is 3 characters')
        .max(40, 'Maximum project name length is 40 characters'),
      description: z.string().max(255, 'Maximum description length is 255 characters').nullable(),
    }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(updateProject$(ctx.user.id, input.projectId, input.name, input.description)),
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(deleteProject$(ctx.user.id, input.projectId)),
  })
  .query('users', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(getUsersOnProject$(ctx.user.id, input.projectId)),
  })
  .mutation('add-user-request', {
    input: z.object({ projectId: z.string(), userId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(addUserToProjectRequest$(ctx.user.id, input.projectId, input.userId)),
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
  .query('requests-for-project', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(getAddRequestForProject$(ctx.user.id, input.projectId)),
  })
  .mutation('rescind-add-request', {
    input: z.object({ projectId: z.string(), userId: z.string(), requestId: z.string() }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(rescindProjectRequest$(ctx.user.id, input.projectId, input.userId, input.requestId)),
  })
  .mutation('remove-user', {
    input: z.object({ projectId: z.string(), userId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(removeUser$(ctx.user.id, input.projectId, input.userId)),
  });
