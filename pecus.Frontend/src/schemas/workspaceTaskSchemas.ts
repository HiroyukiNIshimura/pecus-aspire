import { z } from 'zod';

/**
 * タスク優先度の選択肢
 */
export const taskPriorityOptions = [
  { value: 'Low', label: '低' },
  { value: 'Medium', label: '中' },
  { value: 'High', label: '高' },
  { value: 'Critical', label: '緊急' },
] as const;

/**
 * 予定工数フィールドのスキーマ（任意）
 */
const estimatedHoursOptionalSchema = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const num = Number(val);
  return Number.isNaN(num) ? undefined : num;
}, z.number().positive('予定工数は0より大きい値を入力してください。').optional());

/**
 * 予定工数フィールドのスキーマ（必須）
 */
const estimatedHoursRequiredSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  },
  z
    .number({ message: '予定工数は必須です。0より大きい値を入力してください。' })
    .positive('予定工数は0より大きい値を入力してください。'),
);

/**
 * ワークスペースタスク作成スキーマ（基本）
 */
export const createWorkspaceTaskSchema = z.object({
  content: z.string().min(1, 'タスク内容は必須です。').max(2000, 'タスク内容は2000文字以内で入力してください。'),
  taskTypeId: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z
      .number({ message: 'タスク種類を選択してください。' })
      .int('タスク種類を選択してください。')
      .positive('タスク種類を選択してください。'),
  ),
  assignedUserId: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z
      .number({ message: '担当者は必須です。' })
      .int('担当者を選択してください。')
      .positive('担当者を選択してください。'),
  ),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  startDate: z.string().optional().nullable(),
  dueDate: z
    .string()
    .min(1, '期限日は必須です。')
    .refine(
      (val) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(val);
        return dueDate >= today;
      },
      { message: '期限日は今日以降の日付を指定してください。' },
    ),
  estimatedHours: estimatedHoursOptionalSchema,
});

/**
 * 予定工数必須の場合のワークスペースタスク作成スキーマを生成
 * フィールドレベルの検証（validateField）でも動作するよう、フィールドスキーマ自体を変更
 */
export function createWorkspaceTaskSchemaWithRequiredEstimate(
  requireEstimate: boolean,
): typeof createWorkspaceTaskSchema {
  if (!requireEstimate) {
    return createWorkspaceTaskSchema;
  }

  // estimatedHours フィールドを必須スキーマに置き換え
  // 型の互換性のため unknown 経由でキャスト（実行時の検証ロジックは正しく動作する）
  return createWorkspaceTaskSchema.extend({
    estimatedHours: estimatedHoursRequiredSchema,
  }) as unknown as typeof createWorkspaceTaskSchema;
}

export type CreateWorkspaceTaskInput = z.infer<typeof createWorkspaceTaskSchema>;

/**
 * ワークスペースタスク更新スキーマ（基本オブジェクト）
 * refine 適用前のベーススキーマ
 */
const updateWorkspaceTaskBaseSchema = z.object({
  content: z.string().min(1, 'タスク内容は必須です。').max(2000, 'タスク内容は2000文字以内で入力してください。'),
  taskTypeId: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z
      .number({ message: 'タスク種類を選択してください。' })
      .int('タスク種類を選択してください。')
      .positive('タスク種類を選択してください。'),
  ),
  assignedUserId: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z
      .number({ message: '担当者は必須です。' })
      .int('担当者を選択してください。')
      .positive('担当者を選択してください。'),
  ),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  startDate: z.string().optional().nullable(),
  // 更新時は必須チェックのみ（過去日許容）
  dueDate: z.string().min(1, '期限日は必須です。'),
  estimatedHours: estimatedHoursOptionalSchema,
  actualHours: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  }, z.number().positive('実績工数は0より大きい値を入力してください。').optional()),
  progressPercentage: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = Number(val);
      return Number.isNaN(num) ? 0 : num;
    },
    z.number().min(0, '進捗率は0以上で入力してください。').max(100, '進捗率は100以下で入力してください。'),
  ),
  isCompleted: z.preprocess((val) => val === true || val === 'true' || val === 'on', z.boolean().optional()),
  isDiscarded: z.preprocess((val) => val === true || val === 'true' || val === 'on', z.boolean().optional()),
  discardReason: z.string().max(500, '破棄理由は500文字以内で入力してください。').optional().nullable(),
});

/**
 * 破棄理由の必須チェックを適用するrefine
 */
function applyDiscardReasonRefine<T extends typeof updateWorkspaceTaskBaseSchema>(schema: T) {
  return schema.refine(
    (data) => {
      // 破棄時は破棄理由が必須
      if (data.isDiscarded) {
        return data.discardReason && data.discardReason.trim().length > 0;
      }
      return true;
    },
    {
      message: '破棄する場合は破棄理由を入力してください。',
      path: ['discardReason'],
    },
  );
}

/**
 * ワークスペースタスク更新スキーマ
 */
export const updateWorkspaceTaskSchema = applyDiscardReasonRefine(updateWorkspaceTaskBaseSchema);

export type UpdateWorkspaceTaskInput = z.infer<typeof updateWorkspaceTaskSchema>;

/**
 * 予定工数必須の場合のワークスペースタスク更新スキーマを生成
 * フィールドレベルの検証（validateField）でも動作するよう、フィールドスキーマ自体を変更
 */
export function updateWorkspaceTaskSchemaWithRequiredEstimate(
  requireEstimate: boolean,
): typeof updateWorkspaceTaskSchema {
  if (!requireEstimate) {
    return updateWorkspaceTaskSchema;
  }

  // estimatedHours フィールドを必須スキーマに置き換えてから refine を適用
  // 型の互換性のため unknown 経由でキャスト（実行時の検証ロジックは正しく動作する）
  const extendedSchema = updateWorkspaceTaskBaseSchema.extend({
    estimatedHours: estimatedHoursRequiredSchema,
  }) as unknown as typeof updateWorkspaceTaskBaseSchema;
  return applyDiscardReasonRefine(extendedSchema) as unknown as typeof updateWorkspaceTaskSchema;
}
