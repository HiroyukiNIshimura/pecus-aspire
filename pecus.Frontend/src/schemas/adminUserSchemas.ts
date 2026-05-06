import { z } from 'zod';

const userIdSchema = z
  .number({ error: 'ユーザーIDが不正です。' })
  .int('ユーザーIDが不正です。')
  .positive('ユーザーIDが不正です。');

const userUpdateRequestSchema = z.object({
  username: z
    .string({ error: 'ユーザー名は必須です。' })
    .trim()
    .min(1, 'ユーザー名は必須です。')
    .max(50, 'ユーザー名は50文字以内で入力してください。'),
  isActive: z.boolean({ error: 'アクティブ状態が不正です。' }),
  skillIds: z.array(z.number().int().positive('スキルIDが不正です。')).optional(),
  roleIds: z.array(z.number().int().positive('ロールIDが不正です。')).optional(),
  rowVersion: z
    .number({ error: '行バージョンが不正です。' })
    .int('行バージョンが不正です。')
    .min(0, '行バージョンが不正です。'),
});

export const createUserWithoutPasswordInputSchema = z.object({
  email: z
    .string({ error: 'メールアドレスは必須です。' })
    .email('有効なメールアドレスを入力してください。')
    .max(100, 'メールアドレスは100文字以内で入力してください。'),
  username: z
    .string({ error: 'ユーザー名は必須です。' })
    .trim()
    .min(1, 'ユーザー名は必須です。')
    .max(50, 'ユーザー名は50文字以内で入力してください。'),
  roles: z
    .array(z.number().int().positive('ロールIDが不正です。'), { error: 'ロールを指定してください。' })
    .min(1, '少なくとも1つのロールを選択してください。'),
});

export type CreateUserWithoutPasswordInput = z.infer<typeof createUserWithoutPasswordInputSchema>;

export const updateUserInputSchema = z.object({
  userId: userIdSchema,
  request: userUpdateRequestSchema,
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const requestPasswordResetInputSchema = z.object({
  userId: userIdSchema,
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;

export const resendPasswordSetupInputSchema = z.object({
  userId: userIdSchema,
});

export type ResendPasswordSetupInput = z.infer<typeof resendPasswordSetupInputSchema>;

export const searchUsersForWorkspaceInputSchema = z.object({
  query: z
    .string({ error: '検索クエリを入力してください。' })
    .trim()
    .min(2, '検索クエリは2文字以上で入力してください。')
    .max(100, '検索クエリは100文字以内で入力してください。'),
  limit: z
    .number({ error: '取得件数上限が不正です。' })
    .int('取得件数上限が不正です。')
    .min(1, '取得件数上限は1以上で入力してください。')
    .max(50, '取得件数上限は50以下で入力してください。')
    .optional(),
});

export type SearchUsersForWorkspaceInput = z.infer<typeof searchUsersForWorkspaceInputSchema>;

export const getUsersInputSchema = z.object({
  page: z
    .number({ error: 'ページ番号が不正です。' })
    .int('ページ番号が不正です。')
    .positive('ページ番号が不正です。')
    .optional(),
  isActive: z.boolean({ error: 'アクティブ状態が不正です。' }).optional(),
  username: z.string({ error: 'ユーザー名フィルタが不正です。' }).max(100, 'ユーザー名フィルタが不正です。').optional(),
  skillIds: z.array(z.number().int().positive('スキルIDが不正です。')).optional(),
  skillFilterMode: z.enum(['and', 'or'], { error: 'スキル絞り込み条件が不正です。' }).optional(),
});

export type GetUsersInput = z.infer<typeof getUsersInputSchema>;

export const getUserDetailInputSchema = z.object({
  userId: userIdSchema,
});

export type GetUserDetailInput = z.infer<typeof getUserDetailInputSchema>;

export const getUsersWorkloadInputSchema = z.object({
  userIds: z
    .array(z.number().int().positive('ユーザーIDが不正です。'), { error: 'ユーザーID配列が不正です。' })
    .max(50, 'ユーザーIDは最大50件まで指定できます。'),
});

export type GetUsersWorkloadInput = z.infer<typeof getUsersWorkloadInputSchema>;
