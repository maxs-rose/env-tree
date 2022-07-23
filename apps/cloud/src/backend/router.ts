import * as trpc from "@trpc/server";
import { TypeOf } from "zod";

export const appRouter = trpc.router().query("hello", { resolve: () => "Hi!" });

export type AppRouter = typeof appRouter;
