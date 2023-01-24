import { z } from "zod";
import {
  getUserSettingsObject,
  updateUserSettings,
  userSettingsSchema,
} from "../../user";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getToken: protectedProcedure.query(async ({ ctx }) => {
    const { token } = await ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: { token: true },
    });

    return token;
  }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return await getUserSettingsObject(ctx.session.user.id);
  }),

  updateSettings: protectedProcedure
    .input(userSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      return await updateUserSettings(ctx.session.user.id, input);
    }),
});
