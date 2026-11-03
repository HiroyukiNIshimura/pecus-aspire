'use server';

import { headers } from 'next/headers';
import {
  deleteCredentialWithHeyApi,
  getCredentialRegistrationOptionsWithHeyApi,
  getCredentialsWithHeyApi,
  getPasskeyLoginOptionsWithHeyApi,
  getRecoveryCodeStatusWithHeyApi,
  getSetupRegistrationOptionsWithHeyApi,
  issueRecoveryCodesWithHeyApi,
  registerCredentialWithHeyApi,
  renameCredentialWithHeyApi,
  verifyPasskeyLoginWithHeyApi,
  verifyRecoveryCodeWithHeyApi,
  verifySetupRegistrationWithHeyApi,
} from '@/connectors/HeyApiClient';
import type {
  LoginResponse,
  MessageResponse,
  RoleInfoResponse,
  WebAuthnCredentialResponse,
  WebAuthnLoginOptionsResponse,
  WebAuthnRecoveryCodeStatusResponse,
  WebAuthnRecoveryCodesResponse,
  WebAuthnRecoveryTokenResponse,
  WebAuthnRegistrationOptionsResponse,
  WebAuthnSetupRegistrationResponse,
} from '@/connectors/hey-api-axios/types.gen';
import { getHttpErrorInfo } from '@/libs/apiError';
import { createLoginSession, type LoginDeviceContext } from '@/libs/loginSession';
import { ServerSessionManager } from '@/libs/serverSession';
import {
  type PasskeyLoginOptionsInput,
  type PasskeyLoginVerifyInput,
  passkeyLoginOptionsInputSchema,
  passkeyLoginVerifyInputSchema,
  type RecoveryCodeInput,
  type RegistrationVerifyInput,
  recoveryCodeInputSchema,
  registrationVerifyInputSchema,
  type SetupRegistrationOptionsInput,
  setupRegistrationOptionsInputSchema,
} from '@/schemas/webauthnSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

type PasskeyLoginResult = {
  roles: Array<Pick<RoleInfoResponse, 'name'>>;
  landingPage: LoginResponse['landingPage'];
};

/**
 * パスキー登録系のエラーをユーザー向けメッセージに変換する
 *
 * 401 は「ログイン状態の確認」ではなく、リンク切れ・有効期限切れが原因のため
 * サーバーが返したメッセージを優先して表示する。
 */
function toRegistrationError<T>(error: unknown, defaultMessage: string): ApiResponse<T> {
  const info = getHttpErrorInfo(error);
  if ((info.status === 400 || info.status === 401) && info.bodyMessage) {
    return { success: false, error: 'validation', message: info.bodyMessage, status: info.status };
  }
  return handleApiErrorForAction<T>(error, { defaultMessage });
}

/**
 * クライアント IP をリクエストヘッダーから取得する
 */
async function resolveClientIp(): Promise<string | undefined> {
  const headersList = await headers();
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    undefined
  );
}

/**
 * Server Action: パスキーログイン用のオプションを取得
 */
export async function getPasskeyLoginOptions(
  input: PasskeyLoginOptionsInput,
): Promise<ApiResponse<WebAuthnLoginOptionsResponse>> {
  const parseResult = passkeyLoginOptionsInputSchema.safeParse(input);
  if (!parseResult.success) {
    return validationError(parseResult.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const result = await getPasskeyLoginOptionsWithHeyApi({
      loginIdentifier: parseResult.data.loginIdentifier,
    });
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<WebAuthnLoginOptionsResponse>(error, {
      defaultMessage: 'パスキー認証を開始できませんでした。',
    });
  }
}

/**
 * Server Action: パスキー認証を検証し、セッションを確立する
 */
export async function verifyPasskeyLogin(input: PasskeyLoginVerifyInput): Promise<ApiResponse<PasskeyLoginResult>> {
  const parseResult = passkeyLoginVerifyInputSchema.safeParse(input);
  if (!parseResult.success) {
    return validationError(parseResult.error.issues.map((issue) => issue.message).join(', '));
  }
  if (!parseResult.data.deviceType || !parseResult.data.os) {
    return validationError('デバイスタイプとOS情報は必須です。');
  }

  try {
    const clientIp = await resolveClientIp();
    const response = await verifyPasskeyLoginWithHeyApi({
      challengeId: parseResult.data.challengeId,
      id: parseResult.data.assertion.id,
      rawId: parseResult.data.assertion.rawId,
      type: parseResult.data.assertion.type,
      response: {
        authenticatorData: parseResult.data.assertion.response.authenticatorData,
        signature: parseResult.data.assertion.response.signature,
        clientDataJson: parseResult.data.assertion.response.clientDataJSON,
        userHandle: parseResult.data.assertion.response.userHandle,
      },
      deviceName: parseResult.data.deviceName,
      deviceType: parseResult.data.deviceType,
      os: parseResult.data.os,
      userAgent: parseResult.data.userAgent,
      appVersion: parseResult.data.appVersion,
      timezone: parseResult.data.timezone,
      location: parseResult.data.location,
    });

    const device: LoginDeviceContext = {
      deviceName: parseResult.data.deviceName,
      deviceType: parseResult.data.deviceType ?? undefined,
      os: parseResult.data.os ?? undefined,
      userAgent: parseResult.data.userAgent,
      appVersion: parseResult.data.appVersion,
      timezone: parseResult.data.timezone,
      location: parseResult.data.location,
      ipAddress: clientIp,
    };

    await createLoginSession(response, device);

    return {
      success: true,
      data: {
        roles: response.roles?.map((role: RoleInfoResponse) => ({ name: role.name || '' })) ?? [],
        landingPage: response.landingPage,
      },
    };
  } catch (error) {
    return handleApiErrorForAction<PasskeyLoginResult>(error, {
      defaultMessage: 'パスキー認証に失敗しました。',
    });
  }
}

/**
 * Server Action: セットアップトークン／リカバリートークンから登録オプションを取得
 */
export async function getSetupRegistrationOptions(
  input: SetupRegistrationOptionsInput,
): Promise<ApiResponse<WebAuthnRegistrationOptionsResponse>> {
  const parseResult = setupRegistrationOptionsInputSchema.safeParse(input);
  if (!parseResult.success) {
    return validationError(parseResult.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const result = await getSetupRegistrationOptionsWithHeyApi({
      token: parseResult.data.token,
      recoveryToken: parseResult.data.recoveryToken,
    });
    return { success: true, data: result };
  } catch (error) {
    return toRegistrationError<WebAuthnRegistrationOptionsResponse>(
      error,
      'パスキー登録を開始できませんでした。リンクの有効期限をご確認ください。',
    );
  }
}

/**
 * Server Action: パスキーを登録する（セットアップ・リカバリー）
 */
export async function registerWithSetup(
  input: RegistrationVerifyInput,
): Promise<ApiResponse<WebAuthnSetupRegistrationResponse>> {
  const parseResult = registrationVerifyInputSchema.safeParse(input);
  if (!parseResult.success) {
    return validationError(parseResult.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const result = await verifySetupRegistrationWithHeyApi({
      challengeId: parseResult.data.challengeId,
      id: parseResult.data.credential.id,
      rawId: parseResult.data.credential.rawId,
      type: parseResult.data.credential.type,
      response: {
        attestationObject: parseResult.data.credential.response.attestationObject,
        clientDataJson: parseResult.data.credential.response.clientDataJSON,
        transports: parseResult.data.credential.response.transports,
      },
      name: parseResult.data.name,
      deviceId: parseResult.data.deviceId,
    });
    return { success: true, data: result };
  } catch (error) {
    return toRegistrationError<WebAuthnSetupRegistrationResponse>(error, 'パスキーの登録に失敗しました。');
  }
}

/**
 * Server Action: リカバリーコードを検証し、再登録用トークンを取得
 */
export async function verifyRecoveryCode(
  input: RecoveryCodeInput,
): Promise<ApiResponse<WebAuthnRecoveryTokenResponse>> {
  const parseResult = recoveryCodeInputSchema.safeParse(input);
  if (!parseResult.success) {
    return validationError(parseResult.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const result = await verifyRecoveryCodeWithHeyApi({
      loginIdentifier: parseResult.data.loginIdentifier,
      code: parseResult.data.code,
    });
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<WebAuthnRecoveryTokenResponse>(error, {
      defaultMessage: 'リカバリーコードが正しくないか、有効期限が切れています。',
    });
  }
}

/**
 * Server Action: 登録済みパスキーの一覧を取得
 */
export async function getCredentials(): Promise<ApiResponse<WebAuthnCredentialResponse[]>> {
  try {
    const result = await getCredentialsWithHeyApi();
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<WebAuthnCredentialResponse[]>(error, {
      defaultMessage: 'パスキー一覧の取得に失敗しました。',
    });
  }
}

/**
 * Server Action: ログイン中の端末 ID を取得する（パスキー登録時に端末と紐づける）
 */
export async function getCurrentDeviceId(): Promise<number | undefined> {
  const session = await ServerSessionManager.getSession();
  return session?.device?.id;
}

/**
 * Server Action: 追加のパスキー登録オプションを取得
 */
export async function getCredentialRegistrationOptions(): Promise<ApiResponse<WebAuthnRegistrationOptionsResponse>> {
  try {
    const result = await getCredentialRegistrationOptionsWithHeyApi();
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<WebAuthnRegistrationOptionsResponse>(error, {
      defaultMessage: 'パスキー登録を開始できませんでした。',
    });
  }
}

/**
 * Server Action: 追加のパスキーを登録
 */
export async function registerCredential(
  input: RegistrationVerifyInput,
): Promise<ApiResponse<WebAuthnCredentialResponse>> {
  const parseResult = registrationVerifyInputSchema.safeParse(input);
  if (!parseResult.success) {
    return validationError(parseResult.error.issues.map((issue) => issue.message).join(', '));
  }

  try {
    const result = await registerCredentialWithHeyApi({
      challengeId: parseResult.data.challengeId,
      id: parseResult.data.credential.id,
      rawId: parseResult.data.credential.rawId,
      type: parseResult.data.credential.type,
      response: {
        attestationObject: parseResult.data.credential.response.attestationObject,
        clientDataJson: parseResult.data.credential.response.clientDataJSON,
        transports: parseResult.data.credential.response.transports,
      },
      name: parseResult.data.name,
      deviceId: parseResult.data.deviceId,
    });
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<WebAuthnCredentialResponse>(error, {
      defaultMessage: 'パスキーの登録に失敗しました。',
    });
  }
}

/**
 * Server Action: パスキーの表示名を変更
 */
export async function renameCredential(input: {
  credentialId: number;
  name: string;
}): Promise<ApiResponse<MessageResponse>> {
  if (!input.name.trim()) {
    return validationError('パスキー名は必須です。');
  }

  try {
    const result = await renameCredentialWithHeyApi(input.credentialId, { name: input.name.trim() });
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<MessageResponse>(error, {
      defaultMessage: 'パスキー名の変更に失敗しました。',
    });
  }
}

/**
 * Server Action: パスキーを削除
 */
export async function deleteCredential(input: { credentialId: number }): Promise<ApiResponse<MessageResponse>> {
  try {
    const result = await deleteCredentialWithHeyApi(input.credentialId);
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<MessageResponse>(error, {
      defaultMessage: 'パスキーの削除に失敗しました。',
    });
  }
}

/**
 * Server Action: 未使用のリカバリーコードを保持しているか
 */
export async function getRecoveryCodeStatus(): Promise<ApiResponse<WebAuthnRecoveryCodeStatusResponse>> {
  try {
    const result = await getRecoveryCodeStatusWithHeyApi();
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<WebAuthnRecoveryCodeStatusResponse>(error, {
      defaultMessage: 'リカバリーコードの状態取得に失敗しました。',
    });
  }
}

/**
 * Server Action: リカバリーコードを再発行
 */
export async function issueRecoveryCodes(): Promise<ApiResponse<WebAuthnRecoveryCodesResponse>> {
  try {
    const result = await issueRecoveryCodesWithHeyApi();
    return { success: true, data: result };
  } catch (error) {
    return handleApiErrorForAction<WebAuthnRecoveryCodesResponse>(error, {
      defaultMessage: 'リカバリーコードの発行に失敗しました。',
    });
  }
}
