import { z } from 'zod';

export const markAchievementNotifiedInputSchema = z.object({
  achievementId: z.number({ error: '実績IDが不正です。' }).int('実績IDが不正です。').positive('実績IDが不正です。'),
});

export type MarkAchievementNotifiedInput = z.infer<typeof markAchievementNotifiedInputSchema>;

export const markAllAchievementsNotifiedInputSchema = z.object({});

export type MarkAllAchievementsNotifiedInput = z.infer<typeof markAllAchievementsNotifiedInputSchema>;

export const getAchievementRankingInputSchema = z.object({
  workspaceId: z
    .number({ error: 'ワークスペースIDが不正です。' })
    .int('ワークスペースIDが不正です。')
    .positive('ワークスペースIDが不正です。')
    .optional(),
});

export type GetAchievementRankingInput = z.infer<typeof getAchievementRankingInputSchema>;
