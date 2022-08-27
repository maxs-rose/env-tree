import * as trpc from '@trpc/server';
import { TRPC_ERROR_CODE_KEY } from '@trpc/server/src/rpc/codes';

export const trpcError = (code: TRPC_ERROR_CODE_KEY, message: string) =>
  new trpc.TRPCError({
    code,
    message,
  });

export const unauthorizedError = trpcError('UNAUTHORIZED', 'User does not have access to this project');

export const notFoundError = (message: string) => trpcError('NOT_FOUND', message);
export const projectNotFoundError = notFoundError('Project not found');
