import { z } from 'zod';

const activityPeriodSchema = z
  .enum(['Today', 'Yesterday', 'ThisWeek', 'LastWeek', 'ThisMonth', 'LastMonth'])
  .nullable();

export const fetchItemActivitiesInputSchema = z.object({
  workspaceId: z
    .number({ error: 'ワークスペースIDが不正です。' })
    .int('ワークスペースIDが不正です。')
    .positive('ワークスペースIDが不正です。'),
  itemId: z
    .number({ error: 'アイテムIDが不正です。' })
    .int('アイテムIDが不正です。')
    .positive('アイテムIDが不正です。'),
  page: z
    .number({ error: 'ページ番号が不正です。' })
    .int('ページ番号が不正です。')
    .positive('ページ番号が不正です。')
    .optional(),
});

export type FetchItemActivitiesInput = z.infer<typeof fetchItemActivitiesInputSchema>;

export const fetchMyActivitiesInputSchema = z.object({
  page: z
    .number({ error: 'ページ番号が不正です。' })
    .int('ページ番号が不正です。')
    .positive('ページ番号が不正です。')
    .optional(),
  period: activityPeriodSchema.optional(),
});

export type FetchMyActivitiesInput = z.infer<typeof fetchMyActivitiesInputSchema>;
