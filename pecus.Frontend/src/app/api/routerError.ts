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
