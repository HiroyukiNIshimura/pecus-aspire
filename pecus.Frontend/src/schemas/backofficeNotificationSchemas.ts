import { z } from 'zod';

const notificationIdSchema = z
  .number({ error: '通知IDが不正です。' })
  .int('通知IDが不正です。')
  .positive('通知IDが不正です。');

const rowVersionSchema = z
  .number({ error: '行バージョンが不正です。' })
  .int('行バージョンが不正です。')
  .min(0, '行バージョンが不正です。');

const pageSchema = z
  .number({ error: 'ページ番号が不正です。' })
  .int('ページ番号が不正です。')
  .positive('ページ番号が不正です。');

const pageSizeSchema = z
  .number({ error: 'ページサイズが不正です。' })
  .int('ページサイズが不正です。')
  .positive('ページサイズが不正です。');

export const getBackOfficeNotificationsInputSchema = z.object({
  page: pageSchema.optional(),
  pageSize: pageSizeSchema.optional(),
  includeDeleted: z.boolean({ error: '削除済み表示フラグが不正です。' }).optional(),
});

export type GetBackOfficeNotificationsInput = z.infer<typeof getBackOfficeNotificationsInputSchema>;

export const getBackOfficeNotificationDetailInputSchema = z.object({
  id: notificationIdSchema,
});

export type GetBackOfficeNotificationDetailInput = z.infer<typeof getBackOfficeNotificationDetailInputSchema>;

const systemNotificationTypeSchema = z.enum(
  ['EmergencyMaintenance', 'ScheduledMaintenance', 'Important', 'Info', 'IncidentReport'],
  { error: '通知種別が不正です。' },
);

export const createBackOfficeNotificationInputSchema = z.object({
  subject: z.string({ error: '件名は必須です。' }).trim().min(1, '件名は必須です。'),
  body: z.string({ error: '本文は必須です。' }).min(1, '本文は必須です。'),
  type: systemNotificationTypeSchema,
  publishAt: z.string({ error: '公開開始日時は必須です。' }).min(1, '公開開始日時は必須です。'),
  endAt: z.string().optional().nullable(),
});

export type CreateBackOfficeNotificationInput = z.infer<typeof createBackOfficeNotificationInputSchema>;

export const updateBackOfficeNotificationInputSchema = z.object({
  id: notificationIdSchema,
  request: z.object({
    subject: z.string().trim().min(1, '件名は必須です。').optional(),
    body: z.string().min(1, '本文は必須です。').optional(),
    type: systemNotificationTypeSchema.optional(),
    publishAt: z.string().min(1, '公開開始日時は必須です。').optional(),
    endAt: z.string().optional().nullable(),
    rowVersion: rowVersionSchema,
  }),
});

export type UpdateBackOfficeNotificationInput = z.infer<typeof updateBackOfficeNotificationInputSchema>;

export const deleteBackOfficeNotificationInputSchema = z.object({
  id: notificationIdSchema,
  rowVersion: rowVersionSchema,
  deleteMessages: z.boolean().optional(),
});

export type DeleteBackOfficeNotificationInput = z.infer<typeof deleteBackOfficeNotificationInputSchema>;
