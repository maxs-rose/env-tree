import {
  createConfig,
  deleteConfig,
  duplicateConfig$,
  getExpandedConfigs$,
  linkedConfig,
  updateConfig,
} from '@backend/api/config';
import * as trpc from '@trpc/server';
import { ZConfigValue } from '@utils/types';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';

export const configRouter = trpc
  .router()
  .query('get', {
    input: z.object({ projectId: z.string() }),
    resolve: ({ input }) => firstValueFrom(getExpandedConfigs$(input.projectId)),
  })
  .mutation('create', {
    input: z.object({ projectId: z.string(), configName: z.string() }),
    resolve: ({ input }) => createConfig(input.projectId, input.configName),
  })
  .mutation('duplicate', {
    input: z.object({ projectId: z.string(), targetConfig: z.string(), configName: z.string() }),
    resolve: ({ input }) => firstValueFrom(duplicateConfig$(input.projectId, input.targetConfig, input.configName)),
  })
  .mutation('link', {
    input: z.object({ projectId: z.string(), targetConfig: z.string(), configName: z.string() }),
    resolve: ({ input }) => linkedConfig(input.projectId, input.targetConfig, input.configName),
  })
  .mutation('update', {
    input: z.object({ projectId: z.string(), configId: z.string(), values: ZConfigValue }),
    resolve: ({ input }) => updateConfig(input.projectId, input.configId, input.values),
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: ({ input }) => deleteConfig(input.projectId, input.configId),
  });
