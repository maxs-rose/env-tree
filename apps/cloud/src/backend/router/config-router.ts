import {
  createConfig$,
  deleteConfig$,
  duplicateConfig$,
  getExpandedConfigs$,
  linkedConfig$,
  updateConfig$,
} from '@backend/api/config';
import { createRouter } from '@backend/createRouter';
import { ZConfigValue } from '@utils/types';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';

export const configRouter = createRouter()
  .query('get', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(getExpandedConfigs$(ctx.user.id, input.projectId)),
  })
  .mutation('create', {
    input: z.object({ projectId: z.string(), configName: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(createConfig$(ctx.user.id, input.projectId, input.configName)),
  })
  .mutation('duplicate', {
    input: z.object({ projectId: z.string(), targetConfig: z.string(), configName: z.string() }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(duplicateConfig$(ctx.user.id, input.projectId, input.targetConfig, input.configName)),
  })
  .mutation('link', {
    input: z.object({ projectId: z.string(), targetConfig: z.string(), configName: z.string() }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(linkedConfig$(ctx.user.id, input.projectId, input.targetConfig, input.configName)),
  })
  .mutation('update', {
    input: z.object({
      projectId: z.string(),
      configId: z.string(),
      configVersion: z.string().nullable().optional(),
      values: ZConfigValue,
    }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(
        updateConfig$(ctx.user.id, input.projectId, input.configId, input.configVersion ?? null, input.values)
      ),
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(deleteConfig$(ctx.user.id, input.projectId, input.configId)),
  });
