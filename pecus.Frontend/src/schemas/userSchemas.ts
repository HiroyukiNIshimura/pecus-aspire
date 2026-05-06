import { z } from 'zod';

export const getUserAchievementsInputSchema = z.object({
  userId: z
    .number({ error: 'ユーザーIDが不正です。' })
    .int('ユーザーIDが不正です。')
    .positive('ユーザーIDが不正です。'),
});

export type GetUserAchievementsInput = z.infer<typeof getUserAchievementsInputSchema>;

export const getUserSkillsInputSchema = z.object({
  userId: z
    .number({ error: 'ユーザーIDが不正です。' })
    .int('ユーザーIDが不正です。')
    .positive('ユーザーIDが不正です。'),
});

export type GetUserSkillsInput = z.infer<typeof getUserSkillsInputSchema>;
