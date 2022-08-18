import { deleteUser$, generateAuthToken$, getUser$, renameUser$ } from '@backend/api/user';
import { createRouter } from '@backend/createRouter';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';

export const userRouter = createRouter()
  .query('current', {
    resolve: ({ ctx }) => firstValueFrom(getUser$(ctx.user.id)),
  })
  .mutation('authToken', {
    resolve: ({ ctx }) => firstValueFrom(generateAuthToken$(ctx.user.id)),
  })
  .mutation('rename', {
    input: z.object({ name: z.string() }),
    resolve: ({ ctx, input }) => firstValueFrom(renameUser$(ctx.user.id, input.name)),
  })
  .mutation('delete', {
    resolve: ({ ctx }) => firstValueFrom(deleteUser$(ctx.user.id)),
  });
