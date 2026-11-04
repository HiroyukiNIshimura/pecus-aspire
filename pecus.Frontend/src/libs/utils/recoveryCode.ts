/**
 * リカバリーコードの使い方の説明
 *
 * 画面表示とコピー内容で同じ文言を使うため、ここで一元管理する。
 */
export const RECOVERY_CODE_USAGE_NOTE =
  'リカバリーコードは 1 個につき 1 回だけ使えます。使用したコードは無効になり、残りのコードはそのまま使えます。';

/**
 * リカバリーコードをコピーする際のテキストを生成する
 *
 * 貼り付け先でも「1 回限りの使い捨て」であることが分かるよう、説明文を先頭に含める。
 */
export function buildRecoveryCodeClipboardText(codes: string[]): string {
  return [RECOVERY_CODE_USAGE_NOTE, '', ...codes].join('\n');
}
