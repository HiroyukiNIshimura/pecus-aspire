import { z } from 'zod';

// システム通知種類の定義
export const systemNotificationTypes = [
  'EmergencyMaintenance',
  'ScheduledMaintenance',
  'Important',
  'Info',
  'IncidentReport',
] as const;

/**
 * 組織作成スキーマ
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(1, '組織名は必須です').max(100, '組織名は100文字以内で入力してください'),
  code: z
    .string()
    .min(1, '組織コードは必須です')
    .regex(/^[a-zA-Z0-9-_]+$/, '組織コードは半角英数字とハイフン、アンダースコアのみ入力できます'),
  phoneNumber: z
    .string()
    .min(1, '電話番号は必須です')
    .regex(/^[0-9-]+$/, '電話番号は半角数字とハイフンのみ入力できます'),
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .max(254, 'メールアドレスは254文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  representativeName: z.string().max(100, '代表者名は100文字以内で入力してください').optional().or(z.literal('')),
  description: z.string().max(500, '説明は500文字以内で入力してください').optional().or(z.literal('')),
  adminUsername: z
    .string()
    .min(3, '管理者ユーザー名は3文字以上で入力してください')
    .max(50, '管理者ユーザー名は50文字以内で入力してください'),
  adminEmail: z
    .string()
    .min(1, '管理者メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください')
    .max(254, 'メールアドレスは254文字以内で入力してください'),
});

export type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

/**
 * システム通知作成スキーマ（ベース）- フィールドごとのバリデーションに使用
 */
export const createNotificationBaseSchema = z.object({
  subject: z.string().min(1, '件名は必須です').max(200, '件名は200文字以内で入力してください'),
  body: z.string().min(1, '本文は必須です'),
  type: z.enum(systemNotificationTypes, {
    message: '通知種類を選択してください',
  }),
  publishDate: z.string().min(1, '公開日は必須です'),
  publishTime: z.string().min(1, '公開時間は必須です'),
  endDate: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
});

/**
 * システム通知作成スキーマ（フルバリデーション）- フォーム送信時に使用
 */
export const createNotificationSchema = createNotificationBaseSchema
  .refine(
    (data) => {
      if (!data.publishDate || !data.publishTime) return true;
      const publishDateTime = new Date(`${data.publishDate}T${data.publishTime}`);
      const now = new Date();
      return publishDateTime >= now;
    },
    {
      message: '公開日時は現在以降の日時を設定してください',
      path: ['publishDate'],
    },
  )
  .refine(
    (data) => {
      if (data.endDate && !data.endTime) return false;
      return true;
    },
    {
      message: '終了日を設定した場合、終了時間も必須です',
      path: ['endTime'],
    },
  )
  .refine(
    (data) => {
      if (!data.publishDate || !data.endDate) return true;
      const publishDateTime = new Date(`${data.publishDate}T${data.publishTime}`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime || '23:59'}`);
      return endDateTime > publishDateTime;
    },
    {
      message: '終了日時は公開日時より後に設定してください',
      path: ['endDate'],
    },
  );

export type CreateNotificationFormData = z.infer<typeof createNotificationBaseSchema>;
