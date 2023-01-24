import { z } from "zod";
import { prisma } from "./db";

export const userSettingsSchema = z.object({
  billyApiKey: z.string().optional(),
  stripeApiKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

export async function updateUserSettings(userId: string, input: UserSettings) {
  console.log("updateUserSettings", input);
  const t = await Promise.all(
    Object.entries(input).map(([name, value]) => {
      return prisma.userSetting.upsert({
        where: {
          userId_name: {
            userId,
            name,
          },
        },
        update: {
          value,
        },
        create: {
          userId,
          name,
          value,
        },
      });
    })
  );
  console.log("updateUserSettings", t);
  return t;
}

export async function getUserSettingsObject(userId: string) {
  const settings = await prisma.userSetting.findMany({
    where: {
      userId,
    },
  });

  console.log("getUserSettingsObject", settings);

  return settings.reduce((acc, setting) => {
    // @ts-ignore
    acc[setting.name] = setting.value;
    return acc;
  }, {} as z.infer<typeof userSettingsSchema>);
}
