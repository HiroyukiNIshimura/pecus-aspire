import { z } from 'zod';

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
const recurrenceEndTypeSchema = z.enum(['date', 'count', 'never']);

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
        { message: '有効なURLを入力してください。' },
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
      message: '終了日時は開始日時以降に設定してください。',
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
      message: '繰り返し終了日を指定してください。',
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
      message: '繰り返し回数を指定してください。',
      path: ['recurrenceCount'],
    },
  );

export type CreateAgendaInput = z.infer<typeof createAgendaSchema>;

/**
 * アジェンダ更新スキーマ（作成と同じルール）
 */
export const updateAgendaSchema = createAgendaSchema;

export type UpdateAgendaInput = z.infer<typeof updateAgendaSchema>;
