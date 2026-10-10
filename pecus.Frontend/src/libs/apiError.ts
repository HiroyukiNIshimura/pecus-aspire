import Axios from 'axios';
import type { ErrorResponse } from '@/actions/types';

type ApiErrorLike = {
  status?: number;
  body?: unknown;
};

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as ApiErrorLike).status;
    if (typeof status === 'number') {
      return status;
    }
  }

  if (Axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

function getErrorBody(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'body' in error) {
    return (error as ApiErrorLike).body;
  }

  if (Axios.isAxiosError(error)) {
    return error.response?.data;
  }

  return undefined;
}

export function detect401ValidationError(error: unknown): ErrorResponse | undefined {
  if (getHttpStatus(error) !== 401) {
    return undefined;
  }

  return {
    success: false,
    error: 'unauthorized',
    message: '認証に失敗しました。ログイン状態を確認してください。',
  };
}

export function detect400ValidationError(error: unknown): ErrorResponse | undefined {
  if (getHttpStatus(error) !== 400) {
    return undefined;
  }

  const { bodyMessage } = getHttpErrorInfo(error);
  return {
    success: false,
    error: 'validation',
    message: bodyMessage ?? '入力内容に誤りがあります。',
  };
}

export function detect403ValidationError(error: unknown): ErrorResponse | undefined {
  if (getHttpStatus(error) !== 403) {
    return undefined;
  }

  const { bodyMessage } = getHttpErrorInfo(error);
  return {
    success: false,
    error: 'forbidden',
    message: bodyMessage ?? 'アクセスが禁止されています。',
  };
}

export function detect404ValidationError(error: unknown): ErrorResponse | undefined {
  if (getHttpStatus(error) !== 404) {
    return undefined;
  }

  const { bodyMessage } = getHttpErrorInfo(error);
  return {
    success: false,
    error: 'not_found',
    message: bodyMessage ?? '対象が見つかりません。',
  };
}

export type HttpErrorInfo = {
  status?: number;
  bodyMessage: string | null;
};

export function getHttpErrorInfo(error: unknown): HttpErrorInfo {
  const status = getHttpStatus(error);
  if (status !== undefined && status >= 500) {
    return { status, bodyMessage: null };
  }

  const body = getErrorBody(error);
  const bodyMessage =
    typeof body === 'object' && body !== null && 'message' in body
      ? String((body as Record<string, unknown>).message)
      : null;

  return { status, bodyMessage };
}

export function getUserSafeErrorMessage(error: unknown, fallback: string): string {
  const { bodyMessage, status } = getHttpErrorInfo(error);

  if (status !== undefined && status >= 500) {
    return fallback;
  }

  if (bodyMessage) {
    return bodyMessage;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
