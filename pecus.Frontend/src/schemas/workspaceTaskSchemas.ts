import { z } from 'zod';

/**
 * タスクタイプの選択肢
 */
export const taskTypeOptions = [
  { value: 'Bug', label: 'バグ修正' },
  { value: 'Feature', label: '機能追加' },
  { value: 'Documentation', label: 'ドキュメント' },
  { value: 'Review', label: 'レビュー' },
  { value: 'Testing', label: 'テスト' },
  { value: 'Refactoring', label: 'リファクタリング' },
  { value: 'Research', label: '調査' },
  { value: 'Meeting', label: '会議' },
  { value: 'BusinessNegotiation', label: '商談' },
  { value: 'RequirementsConfirmation', label: '要件確認' },
  { value: 'Other', label: 'その他' },
] as const;

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
 * ワークスペースタスク作成スキーマ
 */
export const createWorkspaceTaskSchema = z.object({
  content: z.string().min(1, 'タスク内容は必須です。').max(2000, 'タスク内容は2000文字以内で入力してください。'),
  taskType: z.enum(
    [
      'Bug',
      'Feature',
      'Documentation',
      'Review',
      'Testing',
      'Refactoring',
      'Research',
      'Meeting',
      'BusinessNegotiation',
      'RequirementsConfirmation',
      'Other',
    ],
    {
      message: 'タスクタイプを選択してください。',
    },
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
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  }, z.number().positive('予定工数は0より大きい値を入力してください。').optional()),
});

export type CreateWorkspaceTaskInput = z.infer<typeof createWorkspaceTaskSchema>;

/**
 * ワークスペースタスク更新スキーマ
 */
export const updateWorkspaceTaskSchema = z
  .object({
    content: z.string().min(1, 'タスク内容は必須です。').max(2000, 'タスク内容は2000文字以内で入力してください。'),
    taskType: z.enum(
      [
        'Bug',
        'Feature',
        'Documentation',
        'Review',
        'Testing',
        'Refactoring',
        'Research',
        'Meeting',
        'BusinessNegotiation',
        'RequirementsConfirmation',
        'Other',
      ],
      {
        message: 'タスクタイプを選択してください。',
      },
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
    dueDate: z.string().optional().nullable(),
    estimatedHours: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    }, z.number().positive('予定工数は0より大きい値を入力してください。').optional()),
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
  })
  .refine(
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

export type UpdateWorkspaceTaskInput = z.infer<typeof updateWorkspaceTaskSchema>;
