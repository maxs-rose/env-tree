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
  // TODO: Add some mechanism to ensure that if multiple users are editing a config someone with an outdated version does not override the new one by accident
  //  maybe good enough to add some kind of "version" into the get response for each config and reject requests with a mismatched version.
  //  The version would have to be regenerated each time the config is updated.
  // TODO: Add groups to config values
  .mutation('update', {
    input: z.object({ projectId: z.string(), configId: z.string(), values: ZConfigValue }),
    resolve: ({ ctx, input }) =>
      firstValueFrom(updateConfig$(ctx.user.id, input.projectId, input.configId, input.values)),
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(deleteConfig$(ctx.user.id, input.projectId, input.configId)),
  });
