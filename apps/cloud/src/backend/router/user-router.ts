import { generateAuthToken$, getUser$ } from '@backend/api/user';
import { createRouter } from '@backend/createRouter';
import { firstValueFrom } from 'rxjs';

export const userRouter = createRouter()
  .query('getCurrent', {
    resolve: ({ ctx }) => firstValueFrom(getUser$(ctx.user.id)),
  })
  .mutation('authToken', {
    resolve: ({ ctx }) => firstValueFrom(generateAuthToken$(ctx.user.id)),
  });
