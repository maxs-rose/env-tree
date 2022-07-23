import * as trpc from "@trpc/server";
import { z } from "zod";
import { prisma } from "@backend/prisma";
import { TRPCError } from "@trpc/server";

export const appRouter = trpc
  .router()
  .query("hello", { resolve: () => "Hi!" })
  .mutation("createProject", {
    input: z.object({ name: z.string().min(3) }),
    resolve: async (data) => {
      console.log(data.input.name);
      const res = await prisma.project.findFirst({
        where: { name: data.input.name },
      });

      if (res) {
        throw new trpc.TRPCError({
          code: "CONFLICT",
          message: "Project already exists",
        });
      }

      return await prisma.project.create({ data: { name: data.input.name } });
    },
  })
  .query("projects", {
    resolve: async () => prisma.project.findMany(),
  });

export type AppRouter = typeof appRouter;
