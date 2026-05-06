import { z } from 'zod';
import type { AttendanceStatus } from '@/connectors/api/pecus';

/**
 * アジェンダ作成/編集用スキーマ
 *
 * バリデーションルール:
 * - タイトル: 必須、200文字以内
 * - 開始日時: 必須
 * - 終了日時: 必須、開始日時より後
 * - 場所: 任意、200文字以内
 * - URL: 任意、2000文字以内、有効なURL形式
 * - 繰り返し間隔: 1〜99
 * - 繰り返し回数: 1〜999
 */

/**
 * 繰り返しタイプ
 */
const recurrenceTypeSchema = z.enum([
  'None',
  'Daily',
  'Weekly',
  'Biweekly',
  'MonthlyByDate',
  'MonthlyByWeekday',
  'Yearly',
]);

/**
 * 繰り返し終了タイプ
 */
const recurrenceEndTypeSchema = z.enum(['date', 'count', 'never'], {
  error: '繰り返し終了タイプが不正です。',
});

/**
 * アジェンダ作成スキーマ
 */
export const createAgendaSchema = z
  .object({
    title: z.string().min(1, 'タイトルは必須です。').max(200, 'タイトルは200文字以内で入力してください。'),
    description: z.string().optional().default(''),
    startAt: z.string().min(1, '開始日時は必須です。'),
    endAt: z.string().min(1, '終了日時は必須です。'),
    isAllDay: z.boolean().default(false),
    location: z.string().max(200, '場所は200文字以内で入力してください。').optional().default(''),
    url: z
      .string()
      .max(2000, 'URLは2000文字以内で入力してください。')
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true;
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        },
        { error: '有効なURLを入力してください。' },
      )
      .optional()
      .default(''),
    // 繰り返し設定
    recurrenceType: recurrenceTypeSchema.default('None'),
    recurrenceInterval: z.preprocess(
      (val) => (val === '' || val === undefined ? 1 : Number(val)),
      z
        .number()
        .int('間隔は整数で入力してください。')
        .min(1, '間隔は1以上で入力してください。')
        .max(99, '間隔は99以下で入力してください。'),
    ),
    recurrenceEndType: recurrenceEndTypeSchema.default('never'),
    recurrenceEndDate: z.string().optional().default(''),
    recurrenceCount: z.preprocess(
      (val) => (val === '' || val === undefined ? null : Number(val)),
      z
        .number()
        .int('回数は整数で入力してください。')
        .min(1, '回数は1以上で入力してください。')
        .max(999, '回数は999以下で入力してください。')
        .nullable(),
    ),
    // 通知設定
    sendNotification: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // 終了日時が開始日時より後であることを確認
      if (!data.startAt || !data.endAt) return true;
      const start = new Date(data.startAt);
      const end = new Date(data.endAt);
      return end >= start;
    },
    {
      error: '終了日時は開始日時以降に設定してください。',
      path: ['endAt'],
    },
  )
  .refine(
    (data) => {
      // 繰り返し終了タイプが「日付指定」の場合、終了日が必要
      if (data.recurrenceType !== 'None' && data.recurrenceEndType === 'date') {
        return !!data.recurrenceEndDate;
      }
      return true;
    },
    {
      error: '繰り返し終了日を指定してください。',
      path: ['recurrenceEndDate'],
    },
  )
  .refine(
    (data) => {
      // 繰り返し終了タイプが「回数指定」の場合、回数が必要
      if (data.recurrenceType !== 'None' && data.recurrenceEndType === 'count') {
        return data.recurrenceCount !== null && data.recurrenceCount >= 1;
      }
      return true;
    },
    {
      error: '繰り返し回数を指定してください。',
      path: ['recurrenceCount'],
    },
  );

export type CreateAgendaInput = z.infer<typeof createAgendaSchema>;

const attendanceStatusValues = [
  'Pending',
  'Accepted',
  'Declined',
  'Tentative',
] as const satisfies readonly AttendanceStatus[];

/**
 * 参加状況更新スキーマ
 */
export const attendanceStatusSchema = z.enum(attendanceStatusValues, {
  // v4 では error パラメータを使用
  error: '参加状況が不正です。',
});

// ---- 共通プリミティブスキーマ ----
export const agendaIdSchema = z.number().int().positive('アジェンダIDが不正です。');
const occurrenceIndexSchema = z.number().int().min(0, 'オカレンスインデックスが不正です。');

// ---- updateAttendance ----
export const updateAttendanceInputSchema = z.object({
  agendaId: agendaIdSchema,
  status: attendanceStatusSchema,
});

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceInputSchema>;

// ---- updateOccurrenceAttendance ----
export const updateOccurrenceAttendanceInputSchema = z.object({
  agendaId: agendaIdSchema,
  occurrenceIndex: occurrenceIndexSchema,
  status: attendanceStatusSchema,
});

export type UpdateOccurrenceAttendanceInput = z.infer<typeof updateOccurrenceAttendanceInputSchema>;

// ---- resetOccurrenceAttendance ----
export const resetOccurrenceAttendanceInputSchema = z.object({
  agendaId: agendaIdSchema,
  occurrenceIndex: occurrenceIndexSchema,
});

export type ResetOccurrenceAttendanceInput = z.infer<typeof resetOccurrenceAttendanceInputSchema>;

// ---- updateAttendanceFromOccurrence ----
export const updateAttendanceFromOccurrenceInputSchema = z.object({
  agendaId: agendaIdSchema,
  occurrenceIndex: occurrenceIndexSchema,
  status: attendanceStatusSchema,
});

export type UpdateAttendanceFromOccurrenceInput = z.infer<typeof updateAttendanceFromOccurrenceInputSchema>;

// ---- cancelAgenda ----
export const cancelAgendaInputSchema = z.object({
  agendaId: agendaIdSchema,
  rowVersion: z.number().int().min(0, '行バージョンが不正です。'),
  reason: z.string().max(1000, '理由は1000文字以内で入力してください。').optional(),
});

export type CancelAgendaInput = z.infer<typeof cancelAgendaInputSchema>;

// ---- cancelOccurrence ----
export const cancelOccurrenceInputSchema = z.object({
  agendaId: agendaIdSchema,
  occurrenceIndex: occurrenceIndexSchema,
  reason: z.string().max(1000, '理由は1000文字以内で入力してください。').optional(),
});

export type CancelOccurrenceInput = z.infer<typeof cancelOccurrenceInputSchema>;

// ---- updateOccurrence ----
export const updateOccurrenceInputSchema = z.object({
  agendaId: agendaIdSchema,
  occurrenceIndex: occurrenceIndexSchema,
  modifications: z.object({
    title: z.string().max(200, 'タイトルは200文字以内で入力してください。').optional(),
    location: z.string().max(200, '場所は200文字以内で入力してください。').optional(),
    url: z.string().max(2000, 'URLは2000文字以内で入力してください。').optional(),
    description: z.string().optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
  }),
});

export type UpdateOccurrenceInput = z.infer<typeof updateOccurrenceInputSchema>;

// ---- markNotificationAsRead ----
export const markNotificationAsReadInputSchema = z.object({
  notificationId: z.number().int().positive('通知IDが不正です。'),
});

export type MarkNotificationAsReadInput = z.infer<typeof markNotificationAsReadInputSchema>;

// ---- markAllNotificationsAsRead ----
export const markAllNotificationsAsReadInputSchema = z.object({
  notificationIds: z.array(z.number().int().positive('通知IDが不正です。')).optional(),
});

export type MarkAllNotificationsAsReadInput = z.infer<typeof markAllNotificationsAsReadInputSchema>;

/**
 * アジェンダ更新スキーマ（作成と同じルール）
 */
export const updateAgendaSchema = createAgendaSchema;

export type UpdateAgendaInput = z.infer<typeof updateAgendaSchema>;

// ---- createAgenda (Action input) ----
const recurrenceTypeActionSchema = z.enum([
  'None',
  'Daily',
  'Weekly',
  'Biweekly',
  'MonthlyByDate',
  'MonthlyByWeekday',
  'Yearly',
]);

export const createAgendaActionInputSchema = z.object({
  title: z.string({ error: 'タイトルは必須です。' }).min(1, 'タイトルは必須です。'),
  description: z.string().optional().nullable(),
  startAt: z.string({ error: '開始日時は必須です。' }).min(1, '開始日時は必須です。'),
  endAt: z.string({ error: '終了日時は必須です。' }).min(1, '終了日時は必須です。'),
  isAllDay: z.boolean().optional(),
  location: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  recurrenceType: recurrenceTypeActionSchema.optional().nullable(),
  recurrenceInterval: z.number().int().positive().optional(),
  recurrenceWeekOfMonth: z.number().int().min(1).max(5).optional().nullable(),
  recurrenceEndDate: z.string().optional().nullable(),
  recurrenceCount: z.number().int().positive().optional().nullable(),
  reminders: z.array(z.number().int().nonnegative('リマインダー値が不正です。')).optional().nullable(),
  attendees: z
    .array(
      z.object({
        userId: z.number().int().positive('ユーザーIDが不正です。').optional(),
        isOptional: z.boolean().optional(),
      }),
    )
    .optional(),
  sendNotification: z.boolean().optional(),
});

export type CreateAgendaActionInput = z.infer<typeof createAgendaActionInputSchema>;

// ---- searchAttendees ----
export const searchAttendeesInputSchema = z.object({
  query: z
    .string({ error: '検索キーワードを入力してください。' })
    .trim()
    .min(2, '検索キーワードは2文字以上で入力してください。')
    .max(100, '検索キーワードは100文字以内で入力してください。'),
});

export type SearchAttendeesInput = z.infer<typeof searchAttendeesInputSchema>;

// ---- searchUsers ----
export const searchUsersInputSchema = z.object({
  query: z
    .string({ error: '検索キーワードを入力してください。' })
    .trim()
    .min(1, '検索キーワードを入力してください。')
    .max(100, '検索キーワードは100文字以内で入力してください。'),
});

export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;
