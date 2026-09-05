import { z } from 'zod';

// Enum 値の定義（API から生成される型には null が含まれるため、独自に定義）
const landingPages = ['Dashboard', 'Workspace', 'MyItems', 'Tasks', 'Committer'] as const;
const focusScorePriorities = ['Priority', 'Deadline', 'SuccessorImpact'] as const;
const badgeVisibilities = ['Private', 'Workspace', 'Organization'] as const;
export const emailNotificationModes = ['Off', 'ImportantOnly', 'Standard', 'Custom'] as const;

export const emailNotificationCustomSettingsSchema = z.object({
  directMention: z.boolean().default(true),
  directNeedReply: z.boolean().default(true),
  directUrge: z.boolean().default(true),
  directHelpWanted: z.boolean().default(true),
  taskAssignedCreated: z.boolean().default(true),
  taskRelatedCompleted: z.boolean().default(true),
  taskOverdue: z.boolean().default(true),
  pinnedItemActivity: z.boolean().default(true),
  assignedItemUpdated: z.boolean().default(false),
  itemBodyUpdated: z.boolean().default(false),
  generalComment: z.boolean().default(false),
  agendaInvitationOrUpdate: z.boolean().default(true),
  agendaCancellationOrReminder: z.boolean().default(true),
  workspaceActivity: z.boolean().default(false),
});

export type EmailNotificationCustomSettingsInput = z.infer<typeof emailNotificationCustomSettingsSchema>;

export const userSettingSchema = z.object({
  canReceiveEmail: z.boolean().default(true),
  emailNotificationMode: z.enum(emailNotificationModes).default('Standard'),
  customEmailSettings: emailNotificationCustomSettingsSchema.default({
    directMention: true,
    directNeedReply: true,
    directUrge: true,
    directHelpWanted: true,
    taskAssignedCreated: true,
    taskRelatedCompleted: true,
    taskOverdue: true,
    pinnedItemActivity: true,
    assignedItemUpdated: false,
    itemBodyUpdated: false,
    generalComment: false,
    agendaInvitationOrUpdate: true,
    agendaCancellationOrReminder: true,
    workspaceActivity: false,
  }),
  emailWorkspaceIds: z.array(z.number().int()).nullable().optional(),
  canReceiveWeeklyReport: z.boolean().default(false),
  canReceiveRealtimeNotification: z.boolean().default(true),
  timeZone: z.string().default('Asia/Tokyo'),
  language: z.string().default('ja'),
  landingPage: z
    .enum(landingPages, {
      error: 'ログイン後のページを選択してください。',
    })
    .optional(),
  focusScorePriority: z
    .enum(focusScorePriorities, {
      error: 'スコアリング優先要素を選択してください。',
    })
    .optional(),
  focusTasksLimit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 10 : Number(val)),
    z
      .number({ error: 'やることピックアップタスク表示件数は必須です。' })
      .int('やることピックアップタスク表示件数は整数で入力してください。')
      .min(5, 'やることピックアップタスク表示件数は5以上で入力してください。')
      .max(20, 'やることピックアップタスク表示件数は20以下で入力してください。'),
  ),
  waitingTasksLimit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 10 : Number(val)),
    z
      .number({ error: '待機中タスク表示件数は必須です。' })
      .int('待機中タスク表示件数は整数で入力してください。')
      .min(5, '待機中タスク表示件数は5以上で入力してください。')
      .max(20, '待機中タスク表示件数は20以下で入力してください。'),
  ),
  badgeVisibility: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z
      .enum(badgeVisibilities, {
        error: 'バッジの公開範囲を選択してください。',
      })
      .optional(),
  ),
});

export type UserSettingInput = z.infer<typeof userSettingSchema>;
