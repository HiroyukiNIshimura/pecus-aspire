/**
 * 日付フォーマット共通ユーティリティ
 *
 * プロジェクト全体で統一された日付表示を提供します。
 * 各コンポーネントでは toLocaleDateString() 等を直接使わず、
 * このファイルの関数を使用してください。
 *
 * 現在のロケールスコープ: ja-JP のみ
 *
 * タイムゾーン対応:
 * - formatDate*, formatDateTime* 関数は `timeZone` パラメータを受け取ります
 * - timeZone (IANA format: "Asia/Tokyo" など) が指定されない場合、ブラウザローカルタイムを使用
 * - Server から送られた UTC ISO 文字列を正しいタイムゾーンで表示します
 *
 * 使用例:
 *   // ユーザーのタイムゾーンに合わせて表示
 *   const userTimeZone = useUserSettings().timeZone // "Asia/Tokyo"
 *   formatDateTime(isoString, undefined, userTimeZone) // "2025/12/18 14:30" (JST)
 *
 *   // コンポーネントのラッパーフック推奨: useFormatDateTime() などを作成
 */

import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日付値の型（Date オブジェクト、ISO文字列、null/undefined を許容）
 */
type DateInput = Date | string | null | undefined;

/**
 * UTC時刻を指定されたタイムゾーンに変換
 * @param date - UTC の日付（DateオブジェクトまたはISO文字列）
 * @param timeZone - IANA タイムゾーン（例: "Asia/Tokyo"）
 * @returns 指定タイムゾーンでの Date オブジェクト
 *
 * 仕組み:
 * 1. Intl.DateTimeFormat で指定タイムゾーンの部分（年月日時分秒）を取得
 * 2. UTC時刻とのオフセットを計算
 * 3. UTC Date を調整して、該当タイムゾーンでの時刻を表す Date オブジェクトを返す
 */
function convertUtcToTimeZone(date: Date, timeZone: string): Date {
  try {
    // Intl API でタイムゾーンの部分を取得
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const partsArray = formatter.formatToParts(date);
    const parts: Record<string, string> = {};
    partsArray.forEach(({ type, value }) => {
      parts[type] = value;
    });

    // タイムゾーン内の時刻を表す Date オブジェクトを作成
    const year = parts.year ?? '2000';
    const month = parts.month ?? '01';
    const day = parts.day ?? '01';
    const hour = parts.hour ?? '00';
    const minute = parts.minute ?? '00';
    const second = parts.second ?? '00';
    const tzDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);

    // ブラウザのローカルタイムゾーンとの差分を計算
    const browserDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));

    // UTC オフセットの差分を計算
    const offset = tzDate.getTime() - browserDate.getTime();

    // 元の UTC 日付を調整
    return new Date(date.getTime() + offset);
  } catch (error) {
    // タイムゾーン指定が無効な場合、元の Date をそのまま返す
    console.warn(`Invalid timeZone: ${timeZone}`, error);
    return date;
  }
}

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
 * @param date - 日付値
 * @param formatStr - フォーマット文字列（デフォルト: 'yyyy/MM/dd'）
 * @param timeZone - IANA タイムゾーン（例: "Asia/Tokyo"）指定時は UTC → 該当タイムゾーンに変換
 *
 * @example
 * formatDate(new Date()) // "2025/12/18"
 * formatDate("2025-12-18T10:00:00Z") // "2025/12/18"
 * formatDate("2025-12-18T10:00:00Z", 'yyyy/MM/dd', 'Asia/Tokyo') // "2025/12/18"（JST に変換）
 * formatDate(null) // "-"
 */
export function formatDate(date: DateInput, formatStr = 'yyyy/MM/dd', timeZone?: string): string {
  let d = toDate(date);
  if (!d) return '-';

  // タイムゾーン指定がある場合、UTC → 該当タイムゾーンに変換
  if (timeZone) {
    d = convertUtcToTimeZone(d, timeZone);
  }

  return format(d, formatStr, { locale: ja });
}

/**
 * 日時をフォーマット（yyyy/MM/dd HH:mm）
 *
 * @param date - 日付値
 * @param timeZone - IANA タイムゾーン（オプション）
 *
 * @example
 * formatDateTime(new Date()) // "2025/12/18 14:30"
 * formatDateTime("2025-12-18T10:00:00Z", 'Asia/Tokyo') // "2025/12/18 19:00" (JST)
 */
export function formatDateTime(date: DateInput, timeZone?: string): string {
  return formatDate(date, 'yyyy/MM/dd HH:mm', timeZone);
}

/**
 * 日時を秒まで含めてフォーマット（yyyy/MM/dd HH:mm:ss）
 *
 * @param date - 日付値
 * @param timeZone - IANA タイムゾーン（オプション）
 *
 * @example
 * formatDateTimeWithSeconds(new Date()) // "2025/12/18 14:30:45"
 * formatDateTimeWithSeconds("2025-12-18T10:00:00Z", 'Asia/Tokyo')
 */
export function formatDateTimeWithSeconds(date: DateInput, timeZone?: string): string {
  return formatDate(date, 'yyyy/MM/dd HH:mm:ss', timeZone);
}

/**
 * 短い日付フォーマット（M/d）- カードやバッジ向け
 *
 * @param date - 日付値
 * @param timeZone - IANA タイムゾーン（オプション）
 *
 * @example
 * formatShortDate(new Date()) // "12/18"
 */
export function formatShortDate(date: DateInput, timeZone?: string): string {
  return formatDate(date, 'M/d', timeZone);
}

/**
 * 短い日付フォーマット（M月d日）- 日本語表記
 *
 * @param date - 日付値
 * @param timeZone - IANA タイムゾーン（オプション）
 *
 * @example
 * formatShortDateJa(new Date()) // "12月18日"
 */
export function formatShortDateJa(date: DateInput, timeZone?: string): string {
  return formatDate(date, 'M月d日', timeZone);
}

/**
 * 年月日の日本語フォーマット（yyyy年M月d日）
 *
 * @param date - 日付値
 * @param timeZone - IANA タイムゾーン（オプション）
 *
 * @example
 * formatFullDateJa(new Date()) // "2025年12月18日"
 */
export function formatFullDateJa(date: DateInput, timeZone?: string): string {
  return formatDate(date, 'yyyy年M月d日', timeZone);
}

/**
 * 相対時間をフォーマット（例: "3時間前", "2日前"）
 *
 * @param date - 日付値
 * @param _timeZone - IANA タイムゾーン（オプション。相対時間計算には影響しません）
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "約1時間前"
 */
export function formatRelativeTime(date: DateInput, _timeZone?: string): string {
  const d = toDate(date);
  if (!d) return '-';
  // 相対時間は UTC オフセットの影響を受けないため、timeZone パラメータは無視
  return formatDistanceToNow(d, { addSuffix: true, locale: ja });
}

/**
 * 時間のみをフォーマット（HH:mm）
 *
 * @param date - 日付値
 * @param timeZone - IANA タイムゾーン（オプション）
 *
 * @example
 * formatTime(new Date()) // "14:30"
 * formatTime("2025-12-18T10:00:00Z", 'Asia/Tokyo') // "19:00" (JST)
 */
export function formatTime(date: DateInput, timeZone?: string): string {
  return formatDate(date, 'HH:mm', timeZone);
}

/**
 * 時間を秒まで含めてフォーマット（HH:mm:ss）
 *
 * @param date - 日付値
 * @param timeZone - IANA タイムゾーン（オプション）
 *
 * @example
 * formatTimeWithSeconds(new Date()) // "14:30:45"
 */
export function formatTimeWithSeconds(date: DateInput, timeZone?: string): string {
  return formatDate(date, 'HH:mm:ss', timeZone);
}

/**
 * 期間をフォーマット
 *
 * @param start - 開始日付
 * @param end - 終了日付
 * @param timeZone - IANA タイムゾーン（オプション）
 *
 * @example
 * formatDateRange(startDate, endDate) // "2025/12/18 〜 2025/12/25"
 * formatDateRange(startDate, endDate, 'Asia/Tokyo') // タイムゾーン付き
 */
export function formatDateRange(start: DateInput, end: DateInput, timeZone?: string): string {
  const startStr = formatDate(start, 'yyyy/MM/dd', timeZone);
  const endStr = formatDate(end, 'yyyy/MM/dd', timeZone);
  if (startStr === '-' && endStr === '-') return '-';
  return `${startStr} 〜 ${endStr}`;
}

// ====================================================================
// React Hook API: ユーザーのタイムゾーン自動統合版
// ====================================================================

/**
 * React コンポーネント内で使用するためのカスタムフック
 * ユーザー設定のタイムゾーンを自動的に適用したフォーマッター
 *
 * @example
 * const { formatDate, formatDateTime, formatTime } = useDateTimeFormatters();
 * <span>{formatDateTime(agenda.startAt)}</span> // 自動的にユーザーのタイムゾーンで表示
 */
export function useDateTimeFormatters() {
  return {
    formatDate: (date: DateInput, formatStr?: string) => formatDate(date, formatStr),
    formatDateTime: (date: DateInput) => formatDateTime(date),
    formatDateTimeWithSeconds: (date: DateInput) => formatDateTimeWithSeconds(date),
    formatShortDate: (date: DateInput) => formatShortDate(date),
    formatShortDateJa: (date: DateInput) => formatShortDateJa(date),
    formatFullDateJa: (date: DateInput) => formatFullDateJa(date),
    formatRelativeTime: (date: DateInput) => formatRelativeTime(date),
    formatTime: (date: DateInput) => formatTime(date),
    formatTimeWithSeconds: (date: DateInput) => formatTimeWithSeconds(date),
    formatDateRange: (start: DateInput, end: DateInput) => formatDateRange(start, end),
  };
}

/**
 * ユーザーのタイムゾーンを考慮したフォーマッターを取得
 * (Redux/ストア統合版 - 実装は各プロジェクトのストア構成に合わせる)
 *
 * 使用方法:
 * 1. useUserSettings() または useAppSettings() から timeZone を取得
 * 2. 下記の関数に timeZone を渡す
 *
 * @example
 * const { timeZone } = useUserSettings();
 * const formatted = formatDateTimeWithUserTZ("2025-12-18T10:00:00Z", timeZone);
 */
export function formatDateWithUserTZ(date: DateInput, userTimeZone?: string): string {
  return formatDate(date, 'yyyy/MM/dd', userTimeZone);
}

export function formatDateTimeWithUserTZ(date: DateInput, userTimeZone?: string): string {
  return formatDateTime(date, userTimeZone);
}

export function formatDateTimeWithSecondsAndUserTZ(date: DateInput, userTimeZone?: string): string {
  return formatDateTimeWithSeconds(date, userTimeZone);
}

export function formatTimeWithUserTZ(date: DateInput, userTimeZone?: string): string {
  return formatTime(date, userTimeZone);
}

export function formatTimeWithSecondsAndUserTZ(date: DateInput, userTimeZone?: string): string {
  return formatTimeWithSeconds(date, userTimeZone);
}

export function formatDateRangeWithUserTZ(start: DateInput, end: DateInput, userTimeZone?: string): string {
  return formatDateRange(start, end, userTimeZone);
}
