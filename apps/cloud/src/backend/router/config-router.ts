import {
  changeConfigLink$,
  createConfig$,
  deleteConfig$,
  duplicateConfig$,
  getExpandedConfigs$,
  linkedConfig$,
  renameConfig$,
  unlinkConfig$,
  updateConfig$,
} from '@backend/api/config';
import { getConfigAudit$ } from '@backend/api/configDiff';
import { createRouter } from '@backend/createRouter';
import { ZConfigValue } from '@utils/shared/types';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';

export const configRouter = createRouter()
  .query('get', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(getExpandedConfigs$(ctx.user.id, input.projectId)),
  })
  .mutation('create', {
    input: z.object({ projectId: z.string(), configName: z.string().trim().min(1) }),
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
  .mutation('unlink', {
    input: z.object({ projectId: z.string(), configId: z.string(), configVersion: z.string() }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(unlinkConfig$(ctx.user.id, input.projectId, input.configId, input.configVersion)),
  })
  .mutation('relink', {
    input: z.object({
      projectId: z.string(),
      configId: z.string(),
      configVersion: z.string(),
      targetConfig: z.string(),
    }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(
        changeConfigLink$(ctx.user.id, input.projectId, input.configId, input.targetConfig, input.configVersion)
      ),
  })
  .mutation('update', {
    input: z.object({
      projectId: z.string(),
      configId: z.string(),
      configVersion: z.string(),
      values: ZConfigValue,
    }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(
        updateConfig$(ctx.user.id, input.projectId, input.configId, input.configVersion ?? null, input.values)
      ),
  })
  .mutation('rename', {
    input: z.object({
      projectId: z.string(),
      configId: z.string(),
      configVersion: z.string(),
      configName: z.string().trim().min(1),
    }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(
        renameConfig$(ctx.user.id, input.projectId, input.configId, input.configVersion ?? null, input.configName)
      ),
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(deleteConfig$(ctx.user.id, input.projectId, input.configId)),
  })
  .query('audit', {
    input: z.object({ projectId: z.string(), configId: z.string(), cursor: z.string().nullish() }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(getConfigAudit$(ctx.user.id, input.projectId, input.configId, input.cursor)),
  });
