import {
  detect400ValidationError,
  detect401ValidationError,
  detect403ValidationError,
  detect404ValidationError,
  getHttpErrorInfo,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';

import type { ApiResponse } from './types';
import { serverError } from './types';

export type ServerActionHandledHttpErrorKind = 'validation' | 'unauthorized' | 'forbidden' | 'not_found';

export type HandleApiErrorForActionOptions = {
  /**
   * ユーザーに見せてもよいデフォルトメッセージ
   * - 500系は必ずこのメッセージが使われる
   */
  defaultMessage: string;

  /**
   * 4xx のうち「この Server Action が業務として扱う」ものだけ true を指定する。
   * 指定しない場合は互換性のため全て true 扱い。
   */
  handled?: Partial<Record<ServerActionHandledHttpErrorKind, boolean>>;

  /**
   * 4xx だが handled で許可されていない/分類できない場合の挙動
   * - 'serverError': ApiResponse に落とす（互換寄り）
   * - 'throw': 例外として上位へ（error.tsx 等に委ねる）
   */
  onUnhandled4xx?: 'serverError' | 'throw';
};

function isHandled(options: HandleApiErrorForActionOptions, kind: ServerActionHandledHttpErrorKind): boolean {
  // 既存の使い方を壊さないため、デフォルトは全て handled
  return options.handled?.[kind] ?? true;
}

/**
 * Server Actions 向けの共通エラー処理。
 *
 * ポイント:
 * - 通信層で status/bodyMessage をデコードするだけに留める
 * - 4xx の扱い（業務判断）は呼び出し側が handled で決める
 * - 5xx は詳細を出さず defaultMessage を返す
 */
export function handleApiErrorForAction<T>(error: unknown, options: HandleApiErrorForActionOptions): ApiResponse<T> {
  const info = getHttpErrorInfo(error);

  // 5xx は詳細非開示。常に serverError に落とす（throw は別の戦術にする）
  if (info.status !== undefined && info.status >= 500) {
    return serverError<T>(options.defaultMessage);
  }

  const error400 = detect400ValidationError(error);
  if (error400) {
    if (!isHandled(options, 'validation')) {
      if (options.onUnhandled4xx === 'throw') {
        throw error;
      }
      return serverError<T>(options.defaultMessage);
    }
    return error400 as ApiResponse<T>;
  }

  const error401 = detect401ValidationError(error);
  if (error401) {
    if (!isHandled(options, 'unauthorized')) {
      if (options.onUnhandled4xx === 'throw') {
        throw error;
      }
      return serverError<T>(options.defaultMessage);
    }
    return error401 as ApiResponse<T>;
  }

  const error403 = detect403ValidationError(error);
  if (error403) {
    if (!isHandled(options, 'forbidden')) {
      if (options.onUnhandled4xx === 'throw') {
        throw error;
      }
      return serverError<T>(options.defaultMessage);
    }
    return error403 as ApiResponse<T>;
  }

  const error404 = detect404ValidationError(error);
  if (error404) {
    if (!isHandled(options, 'not_found')) {
      if (options.onUnhandled4xx === 'throw') {
        throw error;
      }
      return serverError<T>(options.defaultMessage);
    }
    return error404 as ApiResponse<T>;
  }

  // ここに来るのは「未分類の4xx」or 「statusが取れない例外」
  if (info.status !== undefined && info.status >= 400) {
    if (options.onUnhandled4xx === 'throw') {
      throw error;
    }

    // 4xx の message は body.message があれば採用（UI側で意味づけしたいなら handled を絞る）
    return {
      success: false,
      error: 'server',
      message: getUserSafeErrorMessage(error, options.defaultMessage),
    };
  }

  // status が取れない場合や、その他の例外
  return serverError<T>(options.defaultMessage);
}
