import {
  detect401ValidationError,
  detect403ValidationError,
  detect404ValidationError,
} from '@/connectors/api/PecusApiClient';

export type RouterErrorType = {
  error: string;
  status: number;
};

export const parseRouterError = (error: unknown, defaultMessage: string): RouterErrorType => {
  const noAuthError = detect401ValidationError(error);
  if (noAuthError) {
    return { error: noAuthError.message, status: 401 };
  }

  const forbiddenError = detect403ValidationError(error);
  if (forbiddenError) {
    return { error: forbiddenError.message, status: 403 };
  }

  const notFound = detect404ValidationError(error);
  if (notFound) {
    return { error: notFound.message, status: 404 };
  }

  return {
    error: defaultMessage,
    status: 500,
  };
};
