import Axios from 'axios';
import type { ConcurrencyErrorResponseBody } from '@/connectors/ConflictDataTypes.generated';
import type { WorkspaceMemberAssignmentsResponse } from '@/connectors/hey-api-axios/types.gen';

export class ConcurrencyError<T = ConcurrencyErrorResponseBody> extends Error {
  public readonly payload: T;

  constructor(message: string, payload?: T) {
    super(message);
    this.name = 'ConcurrencyError';
    this.payload = payload as T;
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}

export function detectConcurrencyError(error: unknown): ConcurrencyError<ConcurrencyErrorResponseBody> | null {
  if (!Axios.isAxiosError(error) || error.response?.status !== 409) {
    return null;
  }

  const body = error.response.data ?? {};
  const message =
    typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message: unknown }).message)
      : '別のユーザーにより変更されました。';

  console.error('Concurrency error detected:', message);
  return new ConcurrencyError<ConcurrencyErrorResponseBody>(message, body as ConcurrencyErrorResponseBody);
}

export function detectMemberHasAssignmentsError(error: unknown): WorkspaceMemberAssignmentsResponse | null {
  if (!Axios.isAxiosError(error) || error.response?.status !== 409) {
    return null;
  }

  const body: unknown = error.response.data;
  if (
    typeof body === 'object' &&
    body !== null &&
    'hasAssignments' in body &&
    (body as { hasAssignments?: unknown }).hasAssignments === true
  ) {
    console.error('Member has assignments error detected');
    return body as WorkspaceMemberAssignmentsResponse;
  }

  return null;
}
