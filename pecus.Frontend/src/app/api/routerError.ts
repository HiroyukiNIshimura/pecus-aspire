import { NextResponse } from 'next/server';
import {
  detect401ValidationError,
  detect403ValidationError,
  detect404ValidationError,
} from '@/connectors/api/PecusApiClient';

export type RouterErrorType = {
  error: string;
  status: number;
};

/**
 * バリデーションエラーレスポンス（400）を生成
 * パラメータ不正、入力値検証エラー等に使用
 */
export const badRequestError = (message: string): NextResponse<RouterErrorType> => {
  return NextResponse.json({ error: message, status: 400 }, { status: 400 });
};

/**
 * 認証エラーレスポンス（401）を生成
 */
export const unauthorizedError = (message: string): NextResponse<RouterErrorType> => {
  return NextResponse.json({ error: message, status: 401 }, { status: 401 });
};

/**
 * 権限エラーレスポンス（403）を生成
 */
export const forbiddenError = (message: string): NextResponse<RouterErrorType> => {
  return NextResponse.json({ error: message, status: 403 }, { status: 403 });
};

/**
 * Not Found エラーレスポンス（404）を生成
 */
export const notFoundError = (message: string): NextResponse<RouterErrorType> => {
  return NextResponse.json({ error: message, status: 404 }, { status: 404 });
};

/**
 * サーバーエラーレスポンス（500）を生成
 */
export const serverError = (message: string): NextResponse<RouterErrorType> => {
  return NextResponse.json({ error: message, status: 500 }, { status: 500 });
};

/**
 * 例外オブジェクトからエラーレスポンスを生成
 * catch ブロックで捕捉した例外を解析して適切な HTTP ステータスにマッピング
 */
export const parseRouterError = (error: unknown, defaultMessage: string): NextResponse<RouterErrorType> => {
  const noAuthError = detect401ValidationError(error);
  if (noAuthError) {
    return NextResponse.json({ error: noAuthError.message, status: 401 }, { status: 401 });
  }

  const forbiddenError = detect403ValidationError(error);
  if (forbiddenError) {
    return NextResponse.json({ error: forbiddenError.message, status: 403 }, { status: 403 });
  }

  const notFound = detect404ValidationError(error);
  if (notFound) {
    return NextResponse.json({ error: notFound.message, status: 404 }, { status: 404 });
  }

  return NextResponse.json(
    {
      error: defaultMessage,
      status: 500,
    },
    { status: 500 },
  );
};
