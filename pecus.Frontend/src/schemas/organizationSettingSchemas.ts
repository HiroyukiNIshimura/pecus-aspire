import { z } from 'zod';

// Enum 値の定義（API から生成される型には null が含まれるため、独自に定義）
const generativeVendors = ['None', 'OpenAi', 'AzureOpenAi', 'Anthropic', 'GoogleGemini', 'DeepSeek'] as const;
const organizationPlans = ['Unknown', 'Free', 'Standard', 'Enterprise'] as const;
const helpNotificationTargets = ['Organization', 'WorkspaceUsers'] as const;
const groupChatScopes = ['Workspace', 'Organization'] as const;

export const organizationSettingSchema = z.object({
  taskOverdueThreshold: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z
      .number({ message: 'タスク超過閾値は必須です。' })
      .int('タスク超過閾値は整数で入力してください。')
      .min(0, 'タスク超過閾値は0以上で入力してください。')
      .max(365, 'タスク超過閾値は365以下で入力してください。'),
  ),
  weeklyReportDeliveryDay: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z
      .number({ message: '週間レポート配信曜日は必須です。' })
      .int('週間レポート配信曜日は整数で入力してください。')
      .min(0, '週間レポート配信曜日は0以上で入力してください。')
      .max(7, '週間レポート配信曜日は7以下で入力してください。'),
  ),
  mailFromAddress: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      return val;
    },
    z
      .string({ message: 'メール配信元アドレスは必須です。' })
      .max(254, 'メールアドレスは254文字以内で入力してください。')
      .email('有効なメールアドレスを入力してください。'),
  ),
  mailFromName: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      return val;
    },
    z.string({ message: 'メール配信元名は必須です。' }).max(100, 'メール配信元名は100文字以内で入力してください。'),
  ),
  generativeApiVendor: z.enum(generativeVendors, {
    message: '生成APIベンダーを選択してください。',
  }),
  plan: z.enum(organizationPlans, {
    message: 'プランを選択してください。',
  }),
  helpNotificationTarget: z
    .enum(helpNotificationTargets, {
      message: 'ヘルプ通知先を選択してください。',
    })
    .optional()
    .nullable(),
  generativeApiKey: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') return val.trim();
    return val;
  }, z.string().max(512, '生成APIキーは512文字以内で入力してください。').optional()),
  requireEstimateOnTaskCreation: z.boolean().default(false),
  enforcePredecessorCompletion: z.boolean().default(false),
  dashboardHelpCommentMaxCount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 6 : Number(val)),
    z
      .number({ message: 'ヘルプコメント表示件数は必須です。' })
      .int('ヘルプコメント表示件数は整数で入力してください。')
      .min(5, 'ヘルプコメント表示件数は5以上で入力してください。')
      .max(20, 'ヘルプコメント表示件数は20以下で入力してください。'),
  ),
  groupChatScope: z
    .enum(groupChatScopes, {
      message: 'グループチャットスコープを選択してください。',
    })
    .optional()
    .nullable(),
});

export const organizationSettingSchemaWithRules = organizationSettingSchema.superRefine((data, ctx) => {
  if (data.generativeApiVendor !== 'None' && (!data.generativeApiKey || data.generativeApiKey.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['generativeApiKey'],
      message: '選択した生成APIベンダーを利用する場合、APIキーは必須です。',
    });
  }
});

export type OrganizationSettingInput = z.infer<typeof organizationSettingSchemaWithRules>;
