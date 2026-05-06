import { z } from 'zod';

export const markAchievementNotifiedInputSchema = z.object({
  achievementId: z.number({ error: '実績IDが不正です。' }).int('実績IDが不正です。').positive('実績IDが不正です。'),
});

export type MarkAchievementNotifiedInput = z.infer<typeof markAchievementNotifiedInputSchema>;

export const markAllAchievementsNotifiedInputSchema = z.object({});

export type MarkAllAchievementsNotifiedInput = z.infer<typeof markAllAchievementsNotifiedInputSchema>;
