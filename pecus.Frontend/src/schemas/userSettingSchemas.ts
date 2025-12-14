import { z } from 'zod';
import type { FocusScorePriority, LandingPage } from '@/connectors/api/pecus';

const landingPages: readonly [LandingPage, ...LandingPage[]] = [
  'Dashboard',
  'Workspace',
  'MyItems',
  'Tasks',
  'Committer',
];

const focusScorePriorities: readonly [FocusScorePriority, ...FocusScorePriority[]] = [
  'Priority',
  'Deadline',
  'SuccessorImpact',
];

export const userSettingSchema = z.object({
  canReceiveEmail: z.boolean().default(true),
  canReceiveRealtimeNotification: z.boolean().default(true),
  timeZone: z.string().default('Asia/Tokyo'),
  language: z.string().default('ja'),
  landingPage: z
    .enum(landingPages, {
      message: 'ログイン後のページを選択してください。',
    })
    .optional(),
  focusScorePriority: z
    .enum(focusScorePriorities, {
      message: 'スコアリング優先要素を選択してください。',
    })
    .optional(),
  focusTasksLimit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 10 : Number(val)),
    z
      .number({ message: 'フォーカス推奨タスク表示件数は必須です。' })
      .int('フォーカス推奨タスク表示件数は整数で入力してください。')
      .min(5, 'フォーカス推奨タスク表示件数は5以上で入力してください。')
      .max(20, 'フォーカス推奨タスク表示件数は20以下で入力してください。'),
  ),
  waitingTasksLimit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 10 : Number(val)),
    z
      .number({ message: '待機中タスク表示件数は必須です。' })
      .int('待機中タスク表示件数は整数で入力してください。')
      .min(5, '待機中タスク表示件数は5以上で入力してください。')
      .max(20, '待機中タスク表示件数は20以下で入力してください。'),
  ),
});

export type UserSettingInput = z.infer<typeof userSettingSchema>;
