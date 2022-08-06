import { createConfig, deleteConfig, exportConfig, getConfigs, updateConfig } from '@backend/api/config';
import * as trpc from '@trpc/server';
import { z } from 'zod';

export const configRouter = trpc
  .router()
  .query('get', {
    input: z.object({ id: z.string() }),
    resolve: async ({ input }) => await getConfigs(input.id),
  })
  .mutation('create', {
    input: z.object({ projectId: z.string(), configName: z.string() }),
    resolve: async ({ input }) => await createConfig(input.projectId, input.configName),
  })
  .mutation('update', {
    input: z.object({ projectId: z.string(), config: z.object({ id: z.string(), values: z.any() }) }),
    resolve: async ({ input }) => await updateConfig(input.projectId, input.config.id, input.config.values),
  })
  .mutation('delete', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: async ({ input }) => {
      await deleteConfig(input.projectId, input.configId);
    },
  })
  .query('env', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: async ({ input }) => (await exportConfig(input.projectId, input.configId, 'env')) ?? '',
  })
  .query('json', {
    input: z.object({ projectId: z.string(), configId: z.string() }),
    resolve: async ({ input }) => (await exportConfig(input.projectId, input.configId, 'json')) ?? {},
  });
