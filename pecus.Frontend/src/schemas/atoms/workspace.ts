import { z } from 'zod';

/**
 * ワークスペース名
 */
export const workspaceNameSchema = z
  .string()
  .min(1, 'ワークスペース名は必須です。')
  .max(100, 'ワークスペース名は100文字以内で入力してください。');

/**
 * ワークスペース説明
 */
export const workspaceDescriptionSchema = z.string().max(500, '説明は500文字以内で入力してください。').optional();

/**
 * ジャンル ID（フォーム値から数値に変換）
 */
const genreIdPreprocess = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  },
  z
    .number({ message: 'ジャンルは必須です。' })
    .int('ジャンルを選択してください。')
    .positive('ジャンルを選択してください。'),
);

export const workspaceGenreIdSchema = genreIdPreprocess;
export const workspaceGenreIdOptionalSchema = genreIdPreprocess.optional();
