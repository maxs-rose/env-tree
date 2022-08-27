import { createReactQueryHooks } from '@trpc/react';
import { AppRouter } from 'src/backend/router';

export const trpc = createReactQueryHooks<AppRouter>();
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R>
  ? R
  : any;

export const getZodErrorMessage = (trpcZoneErrorMessageString: string) =>
  JSON.parse(trpcZoneErrorMessageString) as Array<{ message: string; path: string[] }>;
