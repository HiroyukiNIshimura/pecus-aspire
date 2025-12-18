/**
 * 日付フォーマット共通ユーティリティ
 *
 * プロジェクト全体で統一された日付表示を提供します。
 * 各コンポーネントでは toLocaleDateString() 等を直接使わず、
 * このファイルの関数を使用してください。
 *
 * 現在のロケールスコープ: ja-JP のみ
 */

import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日付値の型（Date オブジェクト、ISO文字列、null/undefined を許容）
 */
type DateInput = Date | string | null | undefined;

/**
 * 日付文字列またはDateオブジェクトをDateオブジェクトに変換
 */
function toDate(date: DateInput): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * 日付のみをフォーマット（デフォルト: yyyy/MM/dd）
 *
 * @example
 * formatDate(new Date()) // "2025/12/18"
 * formatDate("2025-12-18T10:00:00Z") // "2025/12/18"
 * formatDate(null) // "-"
 */
export function formatDate(date: DateInput, formatStr = 'yyyy/MM/dd'): string {
  const d = toDate(date);
  if (!d) return '-';
  return format(d, formatStr, { locale: ja });
}

/**
 * 日時をフォーマット（yyyy/MM/dd HH:mm）
 *
 * @example
 * formatDateTime(new Date()) // "2025/12/18 14:30"
 */
export function formatDateTime(date: DateInput): string {
  return formatDate(date, 'yyyy/MM/dd HH:mm');
}

/**
 * 日時を秒まで含めてフォーマット（yyyy/MM/dd HH:mm:ss）
 *
 * @example
 * formatDateTimeWithSeconds(new Date()) // "2025/12/18 14:30:45"
 */
export function formatDateTimeWithSeconds(date: DateInput): string {
  return formatDate(date, 'yyyy/MM/dd HH:mm:ss');
}

/**
 * 短い日付フォーマット（M/d）- カードやバッジ向け
 *
 * @example
 * formatShortDate(new Date()) // "12/18"
 */
export function formatShortDate(date: DateInput): string {
  return formatDate(date, 'M/d');
}

/**
 * 短い日付フォーマット（M月d日）- 日本語表記
 *
 * @example
 * formatShortDateJa(new Date()) // "12月18日"
 */
export function formatShortDateJa(date: DateInput): string {
  return formatDate(date, 'M月d日');
}

/**
 * 年月日の日本語フォーマット（yyyy年M月d日）
 *
 * @example
 * formatFullDateJa(new Date()) // "2025年12月18日"
 */
export function formatFullDateJa(date: DateInput): string {
  return formatDate(date, 'yyyy年M月d日');
}

/**
 * 相対時間をフォーマット（例: "3時間前", "2日前"）
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "約1時間前"
 */
export function formatRelativeTime(date: DateInput): string {
  const d = toDate(date);
  if (!d) return '-';
  return formatDistanceToNow(d, { addSuffix: true, locale: ja });
}

/**
 * 時間のみをフォーマット（HH:mm）
 *
 * @example
 * formatTime(new Date()) // "14:30"
 */
export function formatTime(date: DateInput): string {
  return formatDate(date, 'HH:mm');
}

/**
 * 時間を秒まで含めてフォーマット（HH:mm:ss）
 *
 * @example
 * formatTimeWithSeconds(new Date()) // "14:30:45"
 */
export function formatTimeWithSeconds(date: DateInput): string {
  return formatDate(date, 'HH:mm:ss');
}

/**
 * 期間をフォーマット
 *
 * @example
 * formatDateRange(startDate, endDate) // "2025/12/18 〜 2025/12/25"
 */
export function formatDateRange(start: DateInput, end: DateInput): string {
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  if (startStr === '-' && endStr === '-') return '-';
  return `${startStr} 〜 ${endStr}`;
}
